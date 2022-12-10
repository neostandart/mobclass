///<reference path="./m-synclib.ts" />
///<reference path="./../page.ts" />


namespace MediaSyncMachine {
	"use strict";

	export class SyncManager {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _pageOwner: VSect.AppPage;
		private _areas: SyncArea[];
		private _bReady: boolean;

		private _btnSyncTextPause: JQuery;
		private _bSyncTextPauseShowing: boolean = false;

		private _mediaPlaying: SyncMedia | null;


		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(page: VSect.AppPage) {
			this._pageOwner = page;
			this._areas = [];
			this._bReady = false;
			//
			this._btnSyncTextPause = $(document.createElement("button"));
			this._btnSyncTextPause.hide();
			this._btnSyncTextPause.addClass("synctextpause rounded-circle btn btn-light text-primary border-primary fa fa-pause");
			this._btnSyncTextPause.on("click", this._onSyncTextPauseClicked.bind(this));
			//
			window.addEventListener("resize", () => {
				if (this._bSyncTextPauseShowing) {
					this._positionSyncTextPauseButton();
				}
			});
			//
			this._mediaPlaying = null;
		}


		// Infrastructure
		// -------------------------------------------------------------------
		public process(): void {
			let htePagePresenter: HTMLElement = <HTMLElement>this._pageOwner.presenter;
			//
			let htePageBody: HTMLElement = <HTMLElement>this._pageOwner.body;
			htePageBody.appendChild(this._btnSyncTextPause[0]);
			//
			// Структура SyncMachine подготавливается асинхронно для внешнего вызова, но внутри процесс синхронный
			setTimeout(() => {
				const areas: NodeListOf<HTMLElement> = htePagePresenter.querySelectorAll(".sync-area");
				for (let i: number = 0; i < areas.length; i++) {
					const area: SyncArea = new SyncArea(areas[i], <HTMLElement>htePagePresenter.querySelector(".page-body"));
					this._areas.push(area);
					//
					area.players.forEach((player) => {
						player.eventMediaStateChanged.subscribe(this._onMediaStateChanged.bind(this));
					});
				}
				//
				this._bReady = (this._areas.length > 0);
			}, 0);
		}


		// I### Implementation
		// -------------------------------------------------------------------



		// Public Members
		// -------------------------------------------------------------------
		public get isReady(): boolean {
			return this._bReady;
		}


		// Public Events
		// -------------------------------------------------------------------



		// Internal Members
		// -------------------------------------------------------------------

		private _positionSyncTextPauseButton(): void {
			let htePageBody: HTMLElement = <HTMLElement>this._pageOwner.body;
			//
			let nButtonWidth: number | undefined = this._btnSyncTextPause.outerWidth(true);
			let nOffsetTop: number = htePageBody.offsetTop;
			let nOffsetLeft: number = nButtonWidth ? ((htePageBody.offsetLeft + htePageBody.clientWidth) - nButtonWidth) : 0;

			this._btnSyncTextPause.css("top", nOffsetTop + "px");
			this._btnSyncTextPause.css("left", nOffsetLeft + "px");
		}

		private _showSyncTextPauseButton(): void {
			if (!this._bSyncTextPauseShowing) {
				this._positionSyncTextPauseButton();
				//
				this._bSyncTextPauseShowing = true;
				this._btnSyncTextPause.show("slow");
			}
		}
		private _hideSyncTextPauseButton(): void {

			if (this._bSyncTextPauseShowing) {
				this._bSyncTextPauseShowing = false;
				this._btnSyncTextPause.hide("slow");
			}
		}




		// Event Handlers
		// -------------------------------------------------------------------
		private _onMediaStateChanged(sender: SyncMedia, stateNew: SyncMediaStates): void {
			switch (stateNew) {
				case SyncMediaStates.Playing: {
					if (this._mediaPlaying && this._mediaPlaying !== sender) {
						this._mediaPlaying.pause();
					}
					//
					this._mediaPlaying = sender;
					this._showSyncTextPauseButton();
					break;
				}
				case SyncMediaStates.Paused: {
					if (sender === this._mediaPlaying) {
						this._hideSyncTextPauseButton();
					}
					break;
				}

			}
		}

		private _onSyncTextPauseClicked(ev: Event): void {
			if (this._mediaPlaying && this._mediaPlaying.isPlaying) {
				this._mediaPlaying.pause();
			}
		}


		// State Machine
		// -------------------------------------------------------------------

	} // class SyncManager



} // namespace MediaSync
