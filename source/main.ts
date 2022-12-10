/// <reference path="./navigator.ts" />


namespace VSect {
	"use strict";

	export abstract class MainView /* implements IPageNavigation */ {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private static _nav: PageNavigator = new PageNavigator();
		private static _presenter: HTMLDivElement | null;
		private static _pageMaster: MasterPage;

		private static _cachePages: KeyedCache<DetailPage> = new KeyedCache<DetailPage>();

		private static _hteLinkLastActive: HTMLElement | null = null;

		// Infrastructure
		// -------------------------------------------------------------------
		public static launch(path: string): void {
			if (this._testCompatibility()) {
				this._presenter = document.querySelector(".app-mainview");
				if (this._presenter) {
					this._nav.assocPageHost(this._presenter);
					this._nav.eventPageChanged.subscribe(this._onPageChanged);
					//
					FullScreenToggler.init(document);
					//
					let $splashscreen: JQuery = $(".app-splashscreen");
					setTimeout(() => {
						$splashscreen.fadeOut("slow", () => {
							$splashscreen.css("display", "none");
						});
					}, 1500);
				}
				//
				// Загружаем главную страницу
				//
				this._pageMaster = new MasterPage(path);
				this.toMasterPage();
			} else {
				// Браузер устаревший!
				const strScreenHTML: string =
					`<div class="app-incompatible"> 
<div class="message">Извините, ваш браузер не совместим с данным приложением!<br/>
Попробуйте воспользоваться другим браузером.</div>
</div>`;
				if (document.body) {
					document.body.innerHTML = strScreenHTML;
				}
			}
		}


		// Public Members
		// -------------------------------------------------------------------
		public static toMasterPage(): void {
			this._nav.navigate(this._pageMaster);
		}

		public static toPage(path: string, hteLink: HTMLElement | null = null): void {
			let page: DetailPage | undefined;
			if (this._cachePages.contains(path)) {
				page = this._cachePages.get(path);
			} else {
				page = new DetailPage(this._pageMaster, path, this._fetchLifeMode(hteLink)); // Grigory 16-Mar-2020.
				//
				if (page && page.life !== PageLifeModes.Discard) {
					this._cachePages.cache(path, page); // кешируем постоянную страницу.
				}
			}
			//
			this._nav.navigate(page);
			this._setLinkLastActive(hteLink);
		}


		// Public Events
		// -------------------------------------------------------------------



		// Internal Members
		// -------------------------------------------------------------------
		private static _testCompatibility(): boolean {
			let test: any = (<any>window).Modernizr;
			if (test) {
				if (!test.cssanimations) {
					// alert("CSS Animations not support!");
					return false;
				}
				//
				if (!test.video) {
					// alert("HTML5 Video not support!");
					return false;
				}
			}
			//
			return true;
		}

		private static _fetchLifeMode(hte: HTMLElement | null): PageLifeModes {
			let mode: PageLifeModes = PageLifeModes.Persistent;
			//
			if (hte && hte.dataset.life) {
				switch (hte.dataset.life.toLowerCase()) {
					case "discard": {
						mode = PageLifeModes.Discard;
						break;
					}
					case "held": {
						mode = PageLifeModes.Held;
						break;
					}
				}
			}
			//
			return mode;
		}

		private static _setLinkLastActive(link: HTMLElement | null): void {
			if (this._hteLinkLastActive) {
				this._hteLinkLastActive.classList.remove("lastactive");
			}
			//
			this._hteLinkLastActive = link;
			//
			if (this._hteLinkLastActive) {
				this._hteLinkLastActive.classList.add("lastactive");
			}
		}


		// Event Handlers
		// -------------------------------------------------------------------
		private static _onPageChanged(sender: any, args: PageChangedEventArgs): void {
			// if (args.pageNew) {
			// 	console.log("Смена страниц: " + args.pageNew.uri);
			// }
		}


		// State Machine
		// -------------------------------------------------------------------


	} // class MainView

} // namespace MasterDetailApp

