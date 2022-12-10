/// <reference path="./media/m-synclib.ts"/>
/// <reference path="./utils.ts"/>
//

namespace VSect {
	"use strict";

	class PageViewState {
		/* Class Variables and Constants
		----------------------------------------------------------*/
		private _bDefined: boolean = false;
		private _nScrollTop: number = 0;
		private _nScrollLeft: number = 0;


		/* Public Members
		----------------------------------------------------------*/
		public get isDefined(): boolean {
			return this._bDefined;
		}
		public get nScrollTop(): number {
			return this._nScrollTop;
		}
		public set nScrollTop(val: number) {
			this._nScrollTop = val;
			this._bDefined = true;
		}

		public get nScrollLeft(): number {
			return this._nScrollLeft;
		}
		public set nScrollLeft(val: number) {
			this._nScrollLeft = val;
			this._bDefined = true;
		}

		public reset(): void {
			this._nScrollTop = 0;
			this._nScrollLeft = 0;
			this._bDefined = false;
		}

	} // class PageViewState

	// =====================================================================
	export class AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		protected _uri: string;
		protected _eLifeMode: VSect.PageLifeModes;
		protected _presenter: HTMLDivElement | null;
		private _bProcessed: boolean; // Один раз после первого присоед. презентера к DOM
		//
		protected _body: HTMLElement | null;
		protected _oViewState: PageViewState = new PageViewState();
		//
		private _bricks: PageBrick[] = [];
		//
		protected _stateDisplaying: VSect.PageDisplayingStates;
		private _eventStateChanged: EventNest<VSect.PageDisplayingStates>;
		private _eventScroll: EventNest<Event>;

		//
		protected _errorCase?: VSect.ErrorCase;
		private _tag: any;

		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(uri: string, life: PageLifeModes = PageLifeModes.Discard) {
			this._presenter = null;
			this._body = null;
			this._bProcessed = false;
			//
			this._uri = uri;
			this._eLifeMode = life;
			//
			this._stateDisplaying = VSect.PageDisplayingStates.Outside;
			this._eventStateChanged = new EventNest<VSect.PageDisplayingStates>(this);
			this._eventScroll = new EventNest<Event>(this);
		}

		// Infrastructure
		// -------------------------------------------------------------------
		public get isProcessed(): boolean {
			return this._bProcessed;
		}

		public processContent(): Promise<any> {
			return new Promise<any>((handComplete: any, handError: any) => {
				// проверяем наличие prompt-once
				// возможно такие процедуры надо выносить в отдельные ф. (пока здесь)

				const thePresenter: HTMLElement = <HTMLElement>this._presenter;

				//
				//
				//
				// const $PromptOnce: JQuery = $(".prompt-once", thePresenter);
				// if ($PromptOnce.length === 1) {
				// 	let mode = $PromptOnce.data("mode");
				// 	if (mode && mode === "static") {
				// 		$PromptOnce.find("#close").on("click", () => {
				// 			$PromptOnce.remove();
				// 		});
				// 	} else {
				// 		$PromptOnce.hide();
				// 		//
				// 		// если закрыли (и вып. $PromptOnce.remove()) раньше срабатывания таймера закрытия - глюка не происходит,
				// 		// jQuery рулит!
				// 		setTimeout(() => {
				// 			// если есть кнопка close
				// 			$PromptOnce.find("#close").on("click", () => {
				// 				$PromptOnce.remove();
				// 			});
				// 			//
				// 			$PromptOnce.show("fast", () => {
				// 				setTimeout(() => {
				// 					$PromptOnce.hide("fast", () => {
				// 						$PromptOnce.remove();
				// 					});
				// 				}, 5000);
				// 			});
				// 		}, 1000);
				// 	}
				// }

				this._processBricks(thePresenter);

				//
				//
				//
				$(".card.folder", thePresenter).on("shown.bs.collapse", (ev: JQueryEventObject) => {
					$(ev.currentTarget).addClass("opened");
				});
				$(".card.folder", thePresenter).on("hidden.bs.collapse", (ev: JQueryEventObject) => {
					$(ev.currentTarget).removeClass("opened");
				});
				//
				//
				//

				//
				//
				//
				this._raiseProcessed();
				handComplete();
			});
		}

		public markError(error: VSect.ErrorCase): void {
			this._errorCase = error;
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			}
		}


		// INavPage Implementation
		// -------------------------------------------------------------------
		public get presenter(): HTMLDivElement | null {
			return this._presenter;
		}

		public get hasPresenter(): boolean {
			return !!this._presenter;
		}

		public get body(): HTMLElement | null {
			return this._body;
		}

		public get uri(): string {
			return this._uri;
		}

		public get tag(): any | undefined {
			return this._tag;
		}
		public set tag(value: any | undefined) {
			this._tag = value;
		}

		public requestNavigation(): Promise<AppPage> {
			let _this: AppPage = this;
			return new Promise<AppPage>((completeReadyHandler: any, errorReadyHandler: any) => {
				if (_this._presenter) {
					// пока просто жёстко
					completeReadyHandler(_this);
				} else {
					let presenter: HTMLDivElement = createPresenter();
					//
					$(presenter).load(_this._uri, (response, status, xhr) => {
						if (status === "error") {
							let msg = "Error loading App Templates: " + xhr.status + " " + xhr.statusText;
							_this.markError(new ErrorCase(msg));
							_this._setPresenter(presenter);
							errorReadyHandler(_this);
						} else {
							_this._setPresenter(presenter);
							completeReadyHandler(_this);
						}
					});
				}
			});

			// inline Function
			function createPresenter(): HTMLDivElement {
				let element: HTMLDivElement = document.createElement("div");
				element.classList.add("page-presenter");
				return element;
			}
		}

		public notifyAttached(): void {
			if (this._eLifeMode === VSect.PageLifeModes.Persistent && this._body) {
				if (this._oViewState.isDefined) {
					this._body.scrollLeft = this._oViewState.nScrollLeft;
					this._body.scrollTop = this._oViewState.nScrollTop;
					this._oViewState.reset();
				}
			}
			// Grigory. Это событие надо поддержать в vmbook-system!
			this._changeState(VSect.PageDisplayingStates.Active);
		}

		public notifyActive(): void {
			// в этой реализации, кажется никогда не вызывается!
			// this._changeState(VSect.PageDisplayingStates.Active);
		}

		public notifyPassive(): void {
			this._changeState(VSect.PageDisplayingStates.Passive);
		}


		public notifyRejection(): void {
			this._changeState(VSect.PageDisplayingStates.Outside);
			//
			if (this._eLifeMode === VSect.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
				this._releasePresenter();
			} else {
				//
			}

		}

		public notifyDetached(): void {
			if (this._eLifeMode === VSect.PageLifeModes.Persistent && this._body) {
				this._oViewState.nScrollLeft = this._body.scrollLeft;
				this._oViewState.nScrollTop = this._body.scrollTop;
			}
			//
			this._changeState(VSect.PageDisplayingStates.Outside);
			//
			// оповещ. о уходе со страницы 
			// здесь нужно проверять, явл. ли страница постоянной, и если нет, то запускать механизм её отложенной выгрузки.
			if (this._eLifeMode === VSect.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
				this._releasePresenter();
			}
		}

		public get hasError(): boolean {
			return (!!this._errorCase);
		}

		public get error(): ErrorCase | null {
			return (this._errorCase) ? this._errorCase : null;
		}

		public get life(): VSect.PageLifeModes {
			return this._eLifeMode;
		}

		public get state(): VSect.PageDisplayingStates {
			return this._stateDisplaying;
		}

		public get eventStateChanged(): EventNest<PageDisplayingStates> {
			return this._eventStateChanged;
		}

		public get eventScroll(): EventNest<Event> {
			return this._eventScroll;
		}


		public updateLayout(): void {
			//
		}

		// Public Members
		// -------------------------------------------------------------------
		public forceLifeMode(mode: VSect.PageLifeModes): void {
			this._eLifeMode = mode;
		}

		// Virtuals
		// -------------------------------------------------------------------
		// protected _onPresenterCreated?: (vePresenter: HTMLElement) => void = undefined;

		protected _onPresenterCreated(vePresenter: HTMLElement): void {
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			}
		}


		protected _doRestoreState?: () => void = undefined;
		protected _onProcessed?: () => void = undefined;

		// Internal Members
		// -------------------------------------------------------------------
		protected _setPresenter(htePresenter: HTMLDivElement): void {
			this._presenter = htePresenter;
			this._body = htePresenter.querySelector(".page-body");
			if (this._body) {
				this._body.addEventListener("scroll", (ev: Event) => {
					this._eventScroll.raise(ev);
				});
			}
			//
			htePresenter.dataset.origClasses = htePresenter.className;
			//
			if (this._errorCase) {
				this._applyErrorState(this._errorCase);
			} else {
				this._onPresenterCreated(this._presenter);
			}
		}

		protected _releasePresenter(): void {
			this._presenter = null;
			this._bProcessed = false;
		}

		protected _applyErrorState(error: ErrorCase) {
			if (this.hasPresenter) {
				const presenter: HTMLElement = <HTMLElement>this._presenter;
				presenter.innerHTML = "";
				presenter.classList.add("app-error");
				presenter.appendChild(error.getErrorDisplay());
			}
		}

		protected _processBricks(hteScope: HTMLElement): void {
			let bricks: NodeListOf<HTMLElement> = hteScope.querySelectorAll(".bk-brick");
			for (let i = 0; i < bricks.length; i++) {
				let brickpresenter: HTMLElement = bricks[i];
				let typename: string | undefined = brickpresenter.dataset.type;
				switch (typename) {
					case "PromptOnce": {
						this._bricks.push(new PromptOnce(brickpresenter, this));
						break;
					}
					case "HorizontalArea": {
						this._bricks.push(new HorizontalArea(brickpresenter, this));
						break;
					}
				}
			}
		}

		protected _raiseProcessed() {
			this._bProcessed = true; // в люб. случ. считаем страницу обработанной
			setTimeout(() => {
				if (this._onProcessed) {
					this._onProcessed();
				}
				//
				if (this._doRestoreState) {
					this._doRestoreState();
				}
			}, 0);
		}

		// Event Handlers
		// -------------------------------------------------------------------


		// State Machine
		// -------------------------------------------------------------------
		private _changeState(stateNew: VSect.PageDisplayingStates): void {
			const stateOld: VSect.PageDisplayingStates = this._stateDisplaying;
			this._stateDisplaying = stateNew;
			//
			switch (this._stateDisplaying) {
				case VSect.PageDisplayingStates.Outside: {

					break;
				}
				case VSect.PageDisplayingStates.Passive: {

					break;
				}
				case VSect.PageDisplayingStates.Active: {

					break;
				}
			}
			//
			if (this._stateDisplaying !== stateOld) {
				// console.log("Page _changeState: " + this._stateDisplaying);
				this._eventStateChanged.raise(this._stateDisplaying);
			}
		}

	} // class AppPage

	// =====================================================================

	export class MasterPage extends AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _$linkDetailPages?: JQuery;
		private _$btnToggleScreen?: JQuery;

		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(uri: string) {
			super(uri, PageLifeModes.Held);

		}


		// Public Members
		// -------------------------------------------------------------------
		public get title(): string {
			if (this._presenter) {
				let hteTitle: HTMLElement | null = this._presenter.querySelector("title");
				if (hteTitle) {
					return hteTitle.innerText;
				} else {
					return "";
				}
			} else {
				return "";
			}
		}

		// Overrides
		// -------------------------------------------------------------------
		protected _onPresenterCreated(htePresenter: HTMLElement): void {
			super._onPresenterCreated(htePresenter);
			//
			if (!this.hasError) {
				this._$linkDetailPages = $(".master-content *[data-uri]", htePresenter);
				this._$linkDetailPages.on("click", this._onLinkClick);
				//
				this._$btnToggleScreen = $(".master-content header #btnScreenToggle", htePresenter);
				this._$btnToggleScreen.on("click", this._toggleFullScreen);

				(document.documentElement as HTMLElement).addEventListener("fullscreentoggled", this._onFullScreenToggled.bind(this), false);
				(document.documentElement as HTMLElement).addEventListener("fullscreenfailed", this._onFullScreenError.bind(this), false);

				// Grigory
				// ++++++++++++++++++++++++
				// for development purposes
				// Отображение отладочной страницы для SyncManager
				/*
				"D key": keyCode:68 | code:"KeyD" | key:"d"
				*/
				// htePresenter.addEventListener("keydown", (ev: KeyboardEvent) => {
				// 	if (ev.keyCode === 68 && ev.ctrlKey && ev.altKey) {
				// 		MainView.toPage("./pages/_dev/syncaudio.html");
				// 	}
				// });

			}
		}


		// Internal Members
		// -------------------------------------------------------------------
		private _toggleFullScreen(): void {
			if (FullScreenToggler.getFullScreenElement()) {
				FullScreenToggler.cancelFullScreen();
			} else {
				FullScreenToggler.launchFullScreen(<HTMLElement>document.documentElement);
			}
		}


		// Event Handlers
		// -------------------------------------------------------------------
		// Получается здесь Event а не JQuery.Event
		// private _onLinkClick(ev: JQuery.Event): void {
		private _onLinkClick(ev: Event): void {
			let hteAnchor: HTMLElement = <HTMLElement>ev.currentTarget;
			let strPath: string | undefined = hteAnchor.dataset.uri;
			if (strPath) {
				MainView.toPage(strPath, hteAnchor);
			}
		}

		private _onFullScreenToggled(ev: Event): void {
			if (this._$btnToggleScreen) {
				if (FullScreenToggler.getFullScreenElement()) {
					this._$btnToggleScreen.addClass("restorescreen");
				} else {
					this._$btnToggleScreen.removeClass("restorescreen");
				}
			}
		}

		private _onFullScreenError(ev: Event): void {
			// BookRT.Diagnostics.logError(new WinJS.ErrorFromName("FullScreenError", "full screen error has occurred " + ev.target));
		}




	} // class MasterPage

	// =====================================================================
	export class DetailPage extends AppPage {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _master: MasterPage;
		// private _syncScopes: MediaSync.SyncScope[];
		private _syncmach: MediaSyncMachine.SyncManager;

		// Construction / Initialization
		// -------------------------------------------------------------------
		constructor(master: MasterPage, uri: string, life: PageLifeModes = PageLifeModes.Persistent) {
			super(uri, life);
			// super(uri, PageLifeModes.Held);


			//
			this._master = master;
			this._syncmach = new MediaSyncMachine.SyncManager(this);
		}

		// Overrides
		// -------------------------------------------------------------------
		protected _onPresenterCreated(htePresenter: HTMLElement): void {
			super._onPresenterCreated(htePresenter);
			//
			if (!this.hasError) {
				$(".goback", htePresenter).click((ev: JQuery.Event) => {
					MainView.toMasterPage();
				});

				$(".page-header .title", htePresenter).html(this._master.title);

				// Это работает!
				/*
				$("#btnPlay", htePresenter).click((ev: JQuery.Event) => {
					//
					let video: HTMLMediaElement | null = htePresenter.querySelector("video");
					if (video) {
						video.play();
					}
				});
				*/

				//
				// Выполняем процессинг спец. возможностей
				//
				const $player: JQuery = $("audio", htePresenter);
				if ($player.length > 0) {
					($player as any).audioPlayer();
				}
				//
				// возможно надо передавать AppPage!!!
				this._syncmach.process();
				//

			}
		}

		// Internal Members
		// -------------------------------------------------------------------


		// Event Handlers
		// -------------------------------------------------------------------


	} // class DetailPage

} // namespace MasterDetail
