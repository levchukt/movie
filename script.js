
const API_KEY = '5b8edad118bea8230b69570041b6e579'
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const IMG_PLACEHOLDER = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiH_SjAcH3-odNstU_-LtwBeXdmhXUA59q71BYVBdOGw&s=10';

const container = document.querySelector('.movies-grid')
const form = document.querySelector('.search-form')
const input = document.querySelector('.search-input')
const title = document.querySelector('.section-title')
const toggleBtn = document.querySelector('.btn-watchlist-toggle')
const counter = document.querySelector('.counter')
const pagination = document.querySelector('.pagination')
const modal = document.querySelector('.modal');
const modalBody = document.querySelector('.modal__body');
const modalClose = document.querySelector('.modal__close');
const modalOverlay = document.querySelector('.modal__overlay');


let watchlist = JSON.parse(localStorage.getItem('watchlist')) || []
let currentMovies = []
let currentMode = 'browse'
let currentPage = 1
let totalPages = 1
let currentQuery = ''


function saveWatchlist() {
    localStorage.setItem('watchlist', JSON.stringify(watchlist))
}

function isInWatchlist(movieId) {
    return watchlist.some((movie) => movie.id == movieId)
}

function openModal() {
    modal.classList.remove('hidden')
    document.body.style.overflow = 'hidden'
}

function closeModal() {
    modal.classList.add('hidden')
    modalBody.innerHTML = ''
    document.body.style.overflow = ''
}

function toggleWatchlist(movie) {
    if (isInWatchlist(movie.id)) {
        watchlist = watchlist.filter((m) => {
            return m.id !== movie.id
        })
    } else {
        watchlist.push(movie)
    }
    saveWatchlist()
    updateCounter()
}

function updateCounter() {
    counter.innerHTML = watchlist.length
}

async function fetchMovies(url) {
    const response = await fetch(url)
    if (!response.ok) {
        throw new Error(`Помилка сервера: ${response.status}`)
    }
    const data = await response.json()
    return data
}

function showLoading() {
    container.innerHTML = '<p class="status">Завантаження...</p>'
}
function showEmpty() {
    container.innerHTML = '<p class="status">За вашим запитом нічого не знайдено</p>'
}
function showError(message) {
    container.innerHTML = `<p class="status status--error">${message}</p>`
}

function renderPagination() {
    if (currentMode == 'watchlist' || totalPages <= 1) {
        pagination.innerHTML = ''
        return
    }

    const maxPage = Math.min(totalPages, 500)

    pagination.innerHTML = `
        <button class="page-btn" data-page="${currentPage-1}" ${currentPage==1? 'disabled': ''}>Назад</button>
        <span class="page-info">Сторінка ${currentPage} з ${maxPage}</span>
        <button class="page-btn" data-page="${currentPage+1}" ${currentPage==maxPage? 'disabled': ''}>Вперед</button>
    `
}

function renderMovies(movies) {
    currentMovies = movies
    if (movies.length == 0) {
        if (currentMode == 'watchlist') {
            container.innerHTML = 'Ваш список порожній'
        } else {
            showEmpty()
        }
        return
    }
    let tags = movies.map((movie) => {
        const year = movie.release_date ? movie.release_date.slice(0, 4) : 'Рік невідомий'
        const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : IMG_PLACEHOLDER 
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '--'
        return `<div class="movie-card" data-id="${movie.id}">
                    <img class="movie-card__poster" src="${poster}">
                    <h3 class="movie-card__title">${movie.title}</h3>
                    <p class="movie-card__year">${year}</p>
                    <p class="movie-card__rating">${rating}</p>
                    <button class="btn-watchlist ${isInWatchlist(movie.id) ? 'btn-watchlist--active' : ''}">
                        ${isInWatchlist(movie.id) ? 'У списку' : 'Хочу подивитись'}
                    </button>
                </div>`
    })
    
    container.innerHTML = tags.join('')
}

// fetchMovies('https://api.themoviedb.org/3/movie/popular?api_key=5b8edad118bea8230b69570041b6e579&language=uk-UA&page=1')


async function getPopular(page=1) {
    showLoading()
    currentQuery = ''
    currentPage = page
    try {
        let link = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=uk-UA&page=${page}`
        let films = await fetchMovies(link)
        totalPages = films.total_pages
        renderMovies(films.results)
        renderPagination()
    } catch (error) {
        showError('Не вдалось завантажити фільми')
    }
}


async function searchMovies(name, page=1) {
    showLoading()
    title.innerHTML = `Результати пошуку: ${name}`
    currentQuery = name
    currentPage = page
    try {
        let link = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(name)}&language=uk-UA&page=${page}`
        let films = await fetchMovies(link)
        totalPages = films.total_pages
        renderMovies(films.results)
        renderPagination()
    } catch (error) {
        showError('Помилка під час пошуку')
    }
}

async function showMovieDetails(movieId) {
    openModal()
    modalBody.innerHTML = `<p class="status">Завантаження...</p>`

    try {
        const url = `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&language=uk-UA`
        const response = await fetch(url)
        const movie = await response.json()
        renderMovieDetails(movie)
    } catch (error) {
        modalBody.innerHTML = `<p class="status">Не вдалось завантажити.</p>`
    }
}

function renderMovieDetails(movie) {
    const year = movie.release_date ? movie.release_date.slice(0, 4) : 'Рік невідомий'
    const poster = movie.poster_path ? `${IMG_BASE}${movie.poster_path}` : IMG_PLACEHOLDER 
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '--'
    const genres = movie.genres.length >0 ?  movie.genres.map((g)=> g.name).join(', ') : 'Не вказано'
    const overview = movie.overview ? movie.overview : 'Опис українською недоступний'

    const inList = isInWatchlist(movie.id)
    modalBody.innerHTML = `
        <div class="details">
            <img src="${poster}" class="details__poster"/>
            <div class="details__info">
                <h2 class="details__title">${movie.title}</h2>
                <p class="details__overview">${overview}</p>
                <p class="details__genres">Жанри: ${genres}</p>
                <p class="details__year">Рік виходу: ${year}</p>
                <div class="details__meta">
                    <span>${rating} (${movie.vote_count} голосів)</span>
                    <span>${rating}</span>
                    <span>${Math.floor(movie.runtime/60)} годин ${movie.runtime % 60} хвилин</span>
                </div>
                <button class="btn-watchlist btn-watchlist--modal" data-id="${movie.id}">${inList ? 'У списку' : 'Хочу подивитись'}</button>
            </div>
        </div>
    `
}

form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!input.value.trim()) {
        return
    }
    searchMovies(input.value.trim())
})

container.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-watchlist')
    if (btn) {
        const card = btn.closest('.movie-card')
        const movieId = +card.dataset.id
        const movie = currentMovies.find((m)=> m.id === movieId) || watchlist.find((m)=> m.id === movieId)
        if (!movie) return
        toggleWatchlist(movie)
        if (currentMode == 'watchlist') {
            renderMovies(watchlist)
        } else {
            renderMovies(currentMovies)
        }
        updateCounter()
        return
    }

    const card = e.target.closest('.movie-card')
    if (!card) return
    
    
    showMovieDetails(+card.dataset.id)


})

toggleBtn.addEventListener('click', () => {
    if (currentMode == 'watchlist') {
        currentMode = 'browse'
        toggleBtn.innerHTML = `Мій список <span class="counter">${watchlist.length}</span>`
        toggleBtn.classList.remove('btn-watchlist-toggle-active')
        title.innerHTML = 'Популярні фільми'
        getPopular()
    } else {
        currentMode = 'watchlist'
        toggleBtn.innerHTML = 'Популярні'
        toggleBtn.classList.add('btn-watchlist-toggle-active')
        title.innerHTML = 'Мій список'
        renderMovies(watchlist)
    }
})

pagination.addEventListener('click', (e) => {
    let btn = e.target.closest('.page-btn')
    if (!btn || btn.disabled == true) {
        return
    }

    const page = +btn.dataset.page
    if (currentQuery) {
        searchMovies(currentQuery, page)
    } else {
        getPopular(page)
    }
})


modalClose.addEventListener('click', closeModal)
modalOverlay.addEventListener('click', closeModal)

document.addEventListener('keydown', (e) => {
    if (e.key == 'Escape') {
        closeModal()
    }
})

modalBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-watchlist')
    if (btn) {
        const movieId = +btn.dataset.id
        const movie = currentMovies.find((m)=> m.id === movieId) || watchlist.find((m)=> m.id === movieId)
        if (!movie) return
        toggleWatchlist(movie)
        btn.innerHTML = isInWatchlist(movieId) ? 'У списку' : 'Хочу подивитись'
        if (currentMode == 'watchlist') {
            renderMovies(watchlist)
        } else {
            renderMovies(currentMovies)
        }
        updateCounter()
        return
    }
})



getPopular()
updateCounter()