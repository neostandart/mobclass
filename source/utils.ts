namespace VSect {

    export class PageBrick {
        protected _presenter: HTMLElement;
        protected _$presenter: JQuery;
        protected _pageOwner: AppPage;


        constructor(presenter: HTMLElement, owner: AppPage) {
            this._presenter = presenter;
            this._$presenter = $(this._presenter);
            //
            this._pageOwner = owner;
            //
            this._onInitialize();
        }

        protected _onInitialize() {
            //
        }

    }


    export class PromptOnce extends PageBrick {
        private _$PromptOnce: JQuery;
        private _bOpened: boolean = false;
        //
        constructor(presenter: HTMLElement, owner: AppPage) {
            super(presenter, owner);
            //
            this._$PromptOnce = $(presenter);

            let mode = this._$PromptOnce.data("mode");
            if (mode && mode === "static") {
                this._bOpened = true;
                this._$PromptOnce.find("#close").on("click", () => {
                    this._close();
                });
            } else {
                this._$PromptOnce.hide();
                //
                // если закрыли (и вып. $PromptOnce.remove()) раньше срабатывания таймера закрытия - глюка не происходит,
                // jQuery рулит!
                setTimeout(() => {
                    // если есть кнопка close
                    this._$PromptOnce.find("#close").on("click", () => {
                        this._close();
                    });
                    //
                    this._$PromptOnce.show("fast", () => {
                        setTimeout(() => {
                            this._$PromptOnce.hide("fast", () => {
                                this._close();
                            });
                        }, 5000);
                    });
                }, 1000);
            }
        }
        //
        //
        public get isOpened(): boolean {
            return this._bOpened;
        }
        //
        //
        private _close(): void {
            this._$PromptOnce.remove();
            this._bOpened = false;
        }

    }

    // HorzSolidArea ?
    export class HorizontalArea extends PageBrick {
        /* Class Variables and Constants
        ----------------------------------------------------------*/
        private _$content: JQuery;
        private _$indicator: JQuery;
        private _$scrolledArea: JQuery;
        //
        private _isBusy: boolean = false;
        private _isIndicatorDisplaying = false;
        private _bDone: boolean = false;

        /* Construction / Initialization / Desctruction
        ----------------------------------------------------------*/
        constructor(presenter: HTMLElement, owner: AppPage) {
            super(presenter, owner);
            //
            this._$content = this._$presenter.find(".content");
            this._$indicator = this._$presenter.find(".indicator");
            this._$scrolledArea = $(<HTMLElement>owner.body);
            //
            this._$indicator.hide();
            //
            if (this._$content.length === 1 && this._$indicator.length === 1) {
                this._pageOwner.eventStateChanged.subscribe(this._onOwnerStateChanged.bind(this));
                this._pageOwner.eventScroll.subscribe(this._onOwnerScroll.bind(this));
                window.onresize = (ev: Event) => {
                    this._check();
                };
                //
                this._$presenter.on("scroll", (ev: JQuery.Event) => { if (this._isIndicatorDisplaying) { this._hideIndicator(); } });
                //
                setTimeout(() => {
                    this._check();
                }, 100);
            }
        }


        /* Infrastructure
        ----------------------------------------------------------*/



        /* Public Members
        ----------------------------------------------------------*/



        /* Public Events
        ----------------------------------------------------------*/



        /* Overrides
        ----------------------------------------------------------*/



        /* Internal Members
        ----------------------------------------------------------*/
        private _check(): void {
            if (!this._isBusy) {
                this._isBusy = true;
                //
                if (this._checkInViewport(this._$content)) {
                    // А теперь вопрос - нужен ли вообще индикатор?
                    const nElemHorzScrollWidth: number | undefined = this._$presenter.width();
                    const nScrollContentWidth: number | undefined = this._$content.width();
                    if (nScrollContentWidth && nElemHorzScrollWidth) {
                        if (nScrollContentWidth > nElemHorzScrollWidth) {
                            // Да, контент элемента imageline не умещается по ширине!
                            this._displayIndicator();
                        }
                    }
                }
                //
                this._isBusy = false;
            }
        }

        private _checkInViewport($elem: JQuery): boolean {
            let bSatisfy = false;
            //
            const nViewportTop: number | undefined = (this._$scrolledArea).scrollTop();
            const nViewportHeight: number | undefined = (this._$scrolledArea).height();
            if (nViewportTop !== undefined && nViewportHeight !== undefined) {
                const nViewportBottom = nViewportTop + nViewportHeight;
                //
                const nElemTop: number = ($elem.offset() as JQuery.Coordinates).top;
                const nElemHeight: number = $elem.outerHeight() as number;
                const nElemBottom: number = nElemTop + nElemHeight;
                //
                const nElemLedge = nElemBottom - nViewportBottom;
                bSatisfy = (nElemLedge < (nElemHeight / 2));
            }
            //
            return bSatisfy;
        }

        private _displayIndicator() {
            if (!this._bDone) { // показываем только один раз!
                this._bDone = true;
                this._isIndicatorDisplaying = true;
                this._$indicator.show(1000, () => {
                    setTimeout(() => {
                        this._hideIndicator();
                    }, 3500);
                });
            }
        }

        private _hideIndicator(): void {
            if (this._isIndicatorDisplaying) {
                // console.log("закрытие индикатора");
                this._isIndicatorDisplaying = false;
                this._$indicator.hide(1000);
            }
        }

        /* Event Handlers
        ----------------------------------------------------------*/

        private _onOwnerStateChanged(sender: any, args: PageDisplayingStates): void {
            if (args === PageDisplayingStates.Outside) {
                this._bDone = false;
            }
        }
        
        private _onOwnerScroll(sender: any, args: Event): void {
            this._check();
        }


        /* State Machine
        ----------------------------------------------------------*/





    } // class HorizontalArea

} // namespace VSect
