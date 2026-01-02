// Styles
import "./style.scss"
import "../Stylings/Views.scss"

// Imported Types
import Spicetify from "@Spices/Spicetify/Types/App/Spicetify.ts"

// NPM Packages
import { checkKey } from "npm:@rwh/keystrokes"

// Web Modules
import { Maid } from "@Universal/Modules/Maid.ts"
import { Defer, Timeout } from "@Universal/Modules/Scheduler.ts"

// Spices
import {
	GlobalMaid,
	OnSpotifyReady,
	HistoryLocation, SpotifyHistory, SpotifyPlaybar
} from "@Spices/Spicetify/Services/Session.ts"
import {
	Song, SongChanged,
	SongLyrics, SongLyricsLoaded, HaveSongLyricsLoaded,
	RefreshCurrentLyrics
} from "@Spices/Spicetify/Services/Player/mod.ts"

// Components
import CardView from "./Card/mod.ts"
import ContainedPageView from "./Page/Contained.ts"
import FullscreenPageView from "./Page/Fullscreen.ts"

// Our Modules
import { CreateElement, ApplyDynamicBackground } from "./Shared.ts"
import Icons from "./Icons.ts"

// Create our maid
const ViewMaid = GlobalMaid.Give(new Maid())

// Template Constants
const LoadingLyricsCard = `<div class="LoadingLyricsCard Loading"></div>`
const NoLyricsCard = `
	<div class="NoLyricsCard">
		<span>No lyrics available</span>
		<button class="RefreshLyrics">
			<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16"><path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path></svg>
			Retry
		</button>
	</div>
`

// DOM Search Constants
const CurrentMainPage = ".Root__main-view .main-view-container div[data-overlayscrollbars-viewport]"
const LegacyMainPage = ".Root__main-view .main-view-container .os-host"
const RightSidebar = ".Root__right-sidebar"
const ContentsContainer = "aside, section.main-buddyFeed-container"
const CardInsertAnchor = ".main-nowPlayingView-nowPlayingWidget, canvas"
const SpotifyCardViewQuery = ".main-nowPlayingView-section:not(:is(#BeautifulLyrics-CardView)):has(.main-nowPlayingView-lyricsTitle)"

// Store our internal utilities
let SetPlaybarPageIconActiveState: (isActive: boolean) => void
let ActivePageView: (ContainedPageView | FullscreenPageView | undefined)

// Wait for Spotify to start our processing
OnSpotifyReady
.then( // Playbar Icons
	() => {
		// Store references for our buttons
		let lyricsButton: Spicetify.Playbar.Button
		let fullscreenButton: Spicetify.Playbar.Button

		// Lyrics Button
		{
			lyricsButton = new SpotifyPlaybar.Button(
				"Lyrics Page",
				Icons.LyricsPage,
				() => {
					if (ActivePageView === undefined) {
						SpotifyHistory.push(`/BeautifulLyrics/${checkKey("shift") ? "Fullscreen" : "Page"}`)
					} else {
						ActivePageView.Close()
						ActivePageView = undefined
					}
				},
				false, false
			)
			ViewMaid.Give(() => lyricsButton.deregister())

			{
				const CheckForSongExistence = () => {
					if (Song === undefined) {
						lyricsButton.deregister()
					} else {
						lyricsButton.register()
					}
				}
				ViewMaid.Give(SongChanged.Connect(CheckForSongExistence))
				ViewMaid.Give(Timeout(1, CheckForSongExistence))
			}

			SetPlaybarPageIconActiveState = (isActive: boolean) => lyricsButton.active = isActive
		}

		// Fullscreen Button
		{
			fullscreenButton = new SpotifyPlaybar.Button(
				"Enter Fullscreen",
				Icons.FullscreenOpen,
				() => SpotifyHistory.push(
					{
						pathname: "/BeautifulLyrics/Fullscreen",
						search: "",
						hash: "",
						state: {
							FromPlaybar: true
						}
					}
				),
				false,
				false
			)
			ViewMaid.Give(() => fullscreenButton.deregister())
	
			// Mark our fullscreen-button and force it to the right
			fullscreenButton.element.style.order = "100000"
			fullscreenButton.element.id = "BeautifulLyricsFullscreenButton"
		}

		// Handle removing our buttons if we DON'T have a song
		{
			const CheckForSongExistence = () => {
				if (Song === undefined) {
					lyricsButton.deregister()
					fullscreenButton.deregister()
				} else {
					lyricsButton.register()
					fullscreenButton.register()
				}
			}
			ViewMaid.Give(SongChanged.Connect(CheckForSongExistence))
			ViewMaid.Give(Timeout(1, CheckForSongExistence))
		}
	}
)
.then( // Right Side-bar/Card View
	() => {
		// Store our state
		let sidebar: HTMLDivElement, contentsContainer: (HTMLDivElement | undefined)
		const contentsContainerMaid = ViewMaid.Give(new Maid())
		const nowPlayingViewMaid = ViewMaid.Give(new Maid())

		// Each check method
		const CheckForNowPlaying = () => {
			// Clean-up when we are called
			nowPlayingViewMaid.CleanUp()

			// Now check to see if we have our card anchor
			const cardAnchor = contentsContainer!.querySelector<HTMLDivElement>(CardInsertAnchor)
			if (cardAnchor === null) {
				return
			}

			// Immediately add our class to the top container
			const backgroundMaid = nowPlayingViewMaid.Give(new Maid())
			let backgroundApplied = false
			const CheckDynamicBackground = () => {
				if (SpotifyHistory.location.pathname === "/BeautifulLyrics/Fullscreen") {
					backgroundMaid.CleanUp()
					backgroundApplied = false
				} else if (backgroundApplied === false) {
					backgroundApplied = true
					ApplyDynamicBackground(contentsContainer!, backgroundMaid)
				}
			}
			CheckDynamicBackground()
			nowPlayingViewMaid.Give(SpotifyHistory.listen(CheckDynamicBackground))

			// Now we can monitor for Spotifys lyrics card (and hide it)
			const cardContainer = cardAnchor.parentElement!
			const CheckForLyricsCard = () => {
				const cardView = cardContainer.querySelector<HTMLDivElement>(SpotifyCardViewQuery)
				if (cardView !== null) {
					cardView.style.display = "none"
				}
			}
			CheckForLyricsCard()
			const containerObserver = nowPlayingViewMaid.Give(new MutationObserver(CheckForLyricsCard))
			containerObserver.observe(cardContainer, { childList: true })

			// Also handle our own card
			const ShouldCreateCard = () => {
				if (
					// We shouldn't be rendering the card-view when we have another of our views open
					SpotifyHistory.location.pathname.startsWith("/BeautifulLyrics")
					|| (Song === undefined)
				) {
					nowPlayingViewMaid.Clean("Card")
					return
				} else if (HaveSongLyricsLoaded === false) { // Render a template if we're still loading our lyrics
					const card = nowPlayingViewMaid.Give(CreateElement<HTMLDivElement>(LoadingLyricsCard), "Card")
					cardAnchor.after(card)

					return
				} else if (SongLyrics === undefined) { // No lyrics found - show refresh option
					const card = nowPlayingViewMaid.Give(CreateElement<HTMLDivElement>(NoLyricsCard), "Card")
					cardAnchor.after(card)
					
					const refreshBtn = card.querySelector<HTMLButtonElement>(".RefreshLyrics")
					if (refreshBtn) {
						refreshBtn.addEventListener("click", () => {
							refreshBtn.disabled = true
							refreshBtn.style.opacity = "0.5"
							refreshBtn.style.cursor = "not-allowed"
							refreshBtn.innerHTML = `
								<svg role="img" height="16" width="16" aria-hidden="true" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
									<path d="M0 4.75A3.75 3.75 0 0 1 3.75 1h8.5A3.75 3.75 0 0 1 16 4.75v5a3.75 3.75 0 0 1-3.75 3.75H9.81l1.018 1.018a.75.75 0 1 1-1.06 1.06L6.939 12.75l2.829-2.828a.75.75 0 1 1 1.06 1.06L9.811 12h2.439a2.25 2.25 0 0 0 2.25-2.25v-5a2.25 2.25 0 0 0-2.25-2.25h-8.5A2.25 2.25 0 0 0 1.5 4.75v5A2.25 2.25 0 0 0 3.75 12H5v1.5H3.75A3.75 3.75 0 0 1 0 9.75v-5z"></path>
								</svg>
								Retrying...
							`
							
							// Add keyframes for spin if not present
							if (!document.getElementById('beautiful-lyrics-spin-style')) {
								const style = document.createElement('style')
								style.id = 'beautiful-lyrics-spin-style'
								style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } }`
								document.head.appendChild(style)
							}
							
							RefreshCurrentLyrics()
						})
					}

					return
				}

				nowPlayingViewMaid.Give(new CardView(cardAnchor), "Card")
			}
			ShouldCreateCard()
			nowPlayingViewMaid.GiveItems(
				SongLyricsLoaded.Connect(ShouldCreateCard),
				SpotifyHistory.listen(ShouldCreateCard)
			)
		}
		const DeferCheckForNowPlaying = () => ViewMaid.Give(Defer(CheckForNowPlaying), "CheckForNowPlaying")

		const CheckForContentsContainer = () => {
			// Clean-up when we are called
			contentsContainerMaid.CleanUp()
			nowPlayingViewMaid.CleanUp()

			// Determine if our contents-container even exists
			contentsContainer = (sidebar.querySelector<HTMLDivElement>(ContentsContainer) ?? undefined)
			if (contentsContainer === undefined) {
				return
			}

			// Check if there's anything we can do immediately
			CheckForNowPlaying()

			// Handle when we should check
			contentsContainerMaid.Give(SongChanged.Connect(DeferCheckForNowPlaying))

			// Poll for the Now Playing widget until found (max 10 seconds)
			// This handles the case where the widget loads after initial check
			let pollAttempts = 0
			const pollInterval = setInterval(() => {
				pollAttempts++
				const cardAnchor = contentsContainer!.querySelector<HTMLDivElement>(CardInsertAnchor)
				if (cardAnchor !== null) {
					clearInterval(pollInterval)
					CheckForNowPlaying()
				} else if (pollAttempts >= 20) { // 20 * 500ms = 10 seconds
					clearInterval(pollInterval)
				}
			}, 500)
			contentsContainerMaid.Give(() => clearInterval(pollInterval))

		}
		const DeferCheckForContentsContainer = () => ViewMaid.Give(Defer(CheckForContentsContainer), "CheckForContentsContainer")

		const CheckForSidebar = () => {
			// Check for our sidebar existing
			const newSidebar = document.querySelector<HTMLDivElement>(RightSidebar)
			if (newSidebar === null) {
				ViewMaid.Give(Defer(CheckForSidebar), "CheckForSidebar")
				return
			}
			sidebar = newSidebar

			// Create our observer
			const sidebarChildObserver = ViewMaid.Give(new MutationObserver(DeferCheckForContentsContainer))

			// Check if there's anything we can do immediately
			CheckForContentsContainer()

			// Observe our elements
			sidebarChildObserver.observe(sidebar, { childList: true })
			for (const element of sidebar.children) {
				if (
					(element instanceof HTMLDivElement)
					&& ((element.children.length === 0) || (element.querySelector(ContentsContainer) !== null))
				) {
					sidebarChildObserver.observe(element, { childList: true })
				}
			}

			// Also poll for widget at sidebar level as a fallback
			let sidebarPollAttempts = 0
			const sidebarPollInterval = setInterval(() => {
				sidebarPollAttempts++
				// Try to find the card anchor directly in the sidebar
				const cardAnchor = sidebar.querySelector<HTMLDivElement>(CardInsertAnchor)
				if (cardAnchor !== null) {
					clearInterval(sidebarPollInterval)
					// Re-check contents container which will find and setup the widget
					CheckForContentsContainer()
				} else if (sidebarPollAttempts >= 40) { // 40 * 250ms = 10 seconds
					clearInterval(sidebarPollInterval)
				}
			}, 250)
			ViewMaid.Give(() => clearInterval(sidebarPollInterval))
		}
		CheckForSidebar()
	}
)
.then( // Location Handler
	() => {
		let pageContainer: HTMLDivElement
		let pageContainerIsLegacy = false

		const HandleSpotifyLocation = (location: HistoryLocation) => {
			// Remove our previous page-view
			ViewMaid.Clean("PageView")
	
			// Now handle our page-view
			if (location.pathname === "/BeautifulLyrics/Page") {
				SetPlaybarPageIconActiveState(true)
				ActivePageView = ViewMaid.Give(new ContainedPageView(pageContainer, pageContainerIsLegacy), "PageView")
				ActivePageView.Closed.Connect(() => SetPlaybarPageIconActiveState(false))
				ActivePageView.Closed.Connect(() => ActivePageView = undefined)
			} else if (location.pathname === "/BeautifulLyrics/Fullscreen") {
				ActivePageView = ViewMaid.Give(new FullscreenPageView(location.state?.FromPlaybar ?? false), "PageView")
				ActivePageView.Closed.Connect(() => ActivePageView = undefined)
			}
		}

		// Wait until we find our MainPageContainer
		const SearchDOM = () => {
			// Go through each container possibility
			let possibleContainer = document.querySelector<HTMLDivElement>(CurrentMainPage) ?? undefined
			let possiblyLegacy = false
			if (possibleContainer === undefined) {
				possibleContainer = document.querySelector<HTMLDivElement>(LegacyMainPage) ?? undefined
				possiblyLegacy = true
			}

			// If we still have no container we need to wait again for it
			if (possibleContainer === undefined) {
				ViewMaid.Give(Defer(SearchDOM))
			} else {
				pageContainer = possibleContainer
				pageContainerIsLegacy = possiblyLegacy
				HandleSpotifyLocation(SpotifyHistory.location)
				ViewMaid.Give(SpotifyHistory.listen(HandleSpotifyLocation))
			}
		}
		SearchDOM()
	}
)
.then( // Spotify Fullscreen Button Removal
	() => {
		const SearchDOM = () => {
			const controlsContainer = document.querySelector<HTMLButtonElement>(".main-nowPlayingBar-extraControls")
			if (controlsContainer === null) {
				ViewMaid.Give(Defer(SearchDOM))
			} else {
				const observer = new MutationObserver(() => {
					for (const element of controlsContainer.children) {
						if (
							(element.attributes.getNamedItem("data-testid")?.value === "fullscreen-mode-button")
							&& (element.id !== "BeautifulLyricsFullscreenButton")
						) {
							(element as HTMLElement).style.display = "none"
						}
					}
				})
				observer.observe(controlsContainer, { childList: true, subtree: true })
				ViewMaid.Give(() => observer.disconnect())

				// Initial check
				for (const element of controlsContainer.children) {
					if (
						(element.attributes.getNamedItem("data-testid")?.value === "fullscreen-mode-button")
						&& (element.id !== "BeautifulLyricsFullscreenButton")
					) {
						(element as HTMLElement).style.display = "none"
					}
				}
			}
		}
		SearchDOM()
	}
)