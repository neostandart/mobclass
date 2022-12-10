"use strict";
var VSect;
(function (VSect) {
    "use strict";
    let PageLifeModes;
    (function (PageLifeModes) {
        PageLifeModes[PageLifeModes["Discard"] = 0] = "Discard";
        PageLifeModes[PageLifeModes["Persistent"] = 1] = "Persistent";
        PageLifeModes[PageLifeModes["Held"] = 2] = "Held";
    })(PageLifeModes = VSect.PageLifeModes || (VSect.PageLifeModes = {}));
    let PageDisplayingStates;
    (function (PageDisplayingStates) {
        PageDisplayingStates[PageDisplayingStates["Outside"] = 0] = "Outside";
        PageDisplayingStates[PageDisplayingStates["Passive"] = 1] = "Passive";
        PageDisplayingStates[PageDisplayingStates["Active"] = 2] = "Active";
    })(PageDisplayingStates = VSect.PageDisplayingStates || (VSect.PageDisplayingStates = {}));
    let TransDirections;
    (function (TransDirections) {
        TransDirections[TransDirections["Forward"] = 0] = "Forward";
        TransDirections[TransDirections["Backward"] = 1] = "Backward";
    })(TransDirections = VSect.TransDirections || (VSect.TransDirections = {}));
    class Helper {
        static get strAnimEndEventName() {
            // возм. надо исп. Modernizr.prefixed('animation')
            // или проверять CSS Animations support
            return "animationend";
        }
        static hasString(str) {
            return !!((str && str.length > 0)); // ???
        }
        static isString(str) {
            return (typeof str === "string");
        }
        static formatString(str, ...args) {
            let a = Array.prototype.slice.call(args, 0);
            return str.replace(/\{(\d+)\}/g, (match, index) => {
                const param = a[index];
                return (param) ? param.toString() : "?";
            });
        }
        static endsWith(strSubj, strSearch, nPos) {
            if (nPos === undefined || nPos > strSubj.length) {
                nPos = strSubj.length;
            }
            //
            nPos -= strSearch.length;
            const lastIndex = strSubj.indexOf(strSearch, nPos);
            return lastIndex !== -1 && lastIndex === nPos;
        }
        static isVisible(he) {
            return (he.offsetParent !== null);
        }
        static canHorizontallyScroll(element) {
            return (window.getComputedStyle(element).overflowY === "scroll") ? (element.scrollHeight > element.clientHeight) : false;
        }
        static isObject(obj) {
            return (typeof obj === "object");
        }
        static getInteger(val) {
            if (val === undefined || val === null) {
                return null;
            }
            //
            return parseInt(val.toString(), 0);
        }
        static parseOptions(strOpt) {
            if (strOpt) {
                let properties = strOpt.split(", ");
                let obj = {};
                properties.forEach((property) => {
                    let tup = property.split(":");
                    obj[tup[0]] = tup[1];
                });
                //
                return obj;
            }
            //
            return null;
        }
    }
    VSect.Helper = Helper;
    // === Toggle Full Screen Support ============================================
    // -----------------------------------------------------------------------
    class FullScreenToggler {
        // Initialization
        // -------------------------------------------------------------------
        static init(doc) {
            if (doc) {
                this._theDoc = doc;
                this._doc = doc;
            }
            //
            this._theDoc.addEventListener("fullscreenchange", this._onFullScreenChange.bind(this), false);
            document.addEventListener("fullscreenerror", this._onFullScreenError.bind(this), false);
            document.addEventListener("mozfullscreenchange", this._onFullScreenChange.bind(this), false);
            document.addEventListener("mozfullscreenerror", this._onFullScreenError.bind(this), false);
            document.addEventListener("webkitfullscreenchange", this._onFullScreenChange.bind(this), false);
            document.addEventListener("webkitfullscreenerror", this._onFullScreenError.bind(this), false);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        // Public Members
        // -------------------------------------------------------------------
        static getFullScreenElement() {
            return (this._doc.fullscreenElement || this._doc.mozFullScreenElement || this._doc.webkitFullscreenElement);
        }
        static isFullScreenEnabled() {
            return (this._doc.fullscreenEnabled || this._doc.mozFullScreenEnabled || this._doc.webkitFullscreenEnabled);
        }
        static launchFullScreen(hteFullScreen) {
            if (this._elemFullScreen) {
                return;
            }
            //  
            this._elemFullScreen = hteFullScreen;
            let fse = hteFullScreen;
            let rqs;
            if (fse.requestFullscreen) {
                rqs = fse.requestFullscreen;
            }
            else if (fse.mozRequestFullScreen) {
                rqs = fse.mozRequestFullScreen;
            }
            else if (fse.webkitRequestFullscreen) {
                rqs = fse.webkitRequestFullscreen;
            }
            //
            if (rqs) {
                rqs.call(fse);
            }
        }
        static cancelFullScreen() {
            if (this._doc.cancelFullScreen) {
                this._doc.cancelFullScreen();
            }
            else if (this._doc.mozCancelFullScreen) {
                this._doc.mozCancelFullScreen();
            }
            else if (this._doc.webkitCancelFullScreen) {
                this._doc.webkitCancelFullScreen();
            }
        }
        // Public Events
        // -------------------------------------------------------------------
        // Internal Members
        // -------------------------------------------------------------------
        // Event Handlers
        // -------------------------------------------------------------------
        static _onFullScreenChange() {
            let elemCurrent = this.getFullScreenElement();
            if (elemCurrent) {
                elemCurrent.dispatchEvent(this._eventChanged);
            }
            else {
                if (this._elemFullScreen) {
                    this._elemFullScreen.dispatchEvent(this._eventChanged);
                }
            }
            //
            this._elemFullScreen = elemCurrent;
        }
        static _onFullScreenError() {
            if (this._elemFullScreen) {
                this._elemFullScreen.dispatchEvent(this._eventError);
            }
            //
            this._elemFullScreen = undefined;
        }
    } // class FullScreenToggler
    // Class Variables and Constants
    // -------------------------------------------------------------------
    FullScreenToggler._theDoc = document;
    FullScreenToggler._doc = document;
    FullScreenToggler._elemFullScreen = undefined;
    FullScreenToggler._eventChanged = new Event("fullscreentoggled");
    FullScreenToggler._eventError = new Event("fullscreenfailed");
    VSect.FullScreenToggler = FullScreenToggler;
    class ErrorCase {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(source, expl) {
            if (expl) {
                this._bFatal = expl.bFatal;
                this._strCaption = expl.strCaption;
                this._strStack = expl.strStack;
            }
            else {
                this._bFatal = false;
                this._strCaption = "";
                this._strStack = "";
            }
            //
            this._processSource(source);
        }
        // Public Members
        // -------------------------------------------------------------------
        getErrorDisplay() {
            const hteErrorDisplay = document.createElement("div");
            hteErrorDisplay.classList.add("errordisplay");
            const hteCaption = document.createElement("div");
            hteCaption.classList.add("caption");
            hteErrorDisplay.appendChild(hteCaption);
            if (this._strCaption) {
                hteCaption.innerHTML = this._strCaption;
            }
            const hteMessage = document.createElement("div");
            hteMessage.classList.add("message");
            hteErrorDisplay.appendChild(hteMessage);
            if (this._strMessage) {
                hteMessage.innerHTML = this._strMessage;
            }
            const hteStack = document.createElement("div");
            hteStack.classList.add("stack");
            hteErrorDisplay.appendChild(hteStack);
            if (this._strStack) {
                hteStack.innerHTML = this._strStack;
            }
            return hteErrorDisplay;
        }
        // Internal Members
        // -------------------------------------------------------------------
        _processSource(source) {
            try {
                if (source) {
                    if (source.message) {
                        this._strMessage = source.message;
                    }
                    else {
                        this._strMessage = source.toString();
                    }
                }
                else {
                    this._strMessage = "?";
                }
            }
            catch (error) {
                this._strMessage = "[Failed to process error]";
            }
        }
    } // class ErrorCase
    VSect.ErrorCase = ErrorCase;
    class KeyedCollection {
        constructor() {
            this.items = {};
            this.count = 0;
        }
        ContainsKey(key) {
            return this.items.hasOwnProperty(key);
        }
        Count() {
            return this.count;
        }
        Add(key, value) {
            if (!this.items.hasOwnProperty(key)) {
                this.count++;
            }
            this.items[key] = value;
        }
        Remove(key) {
            let val = this.items[key];
            delete this.items[key];
            this.count--;
            return val;
        }
        Item(key) {
            return this.items[key];
        }
        Keys() {
            let keySet = [];
            for (let prop in this.items) {
                if (this.items.hasOwnProperty(prop)) {
                    keySet.push(prop);
                }
            }
            return keySet;
        }
        Values() {
            let values = [];
            for (let prop in this.items) {
                if (this.items.hasOwnProperty(prop)) {
                    values.push(this.items[prop]);
                }
            }
            return values;
        }
    }
    VSect.KeyedCollection = KeyedCollection;
    class KeyedCache {
        constructor() {
            this._theCache = new KeyedCollection();
        }
        contains(uri) {
            return this._theCache.ContainsKey(uri);
        }
        cache(uri, element) {
            if (!this._theCache.ContainsKey(uri)) {
                this._theCache.Add(uri, element);
            }
        }
        get(uri) {
            return this._theCache.Item(uri);
        }
        retrieve(uri) {
            let element = this._theCache.Item(uri);
            this._theCache.Remove(uri);
            return element;
        }
        release(uri) {
            this._theCache.Remove(uri);
        }
    }
    VSect.KeyedCache = KeyedCache;
})(VSect || (VSect = {})); // namespace MasterDetail
var VSect;
(function (VSect) {
    "use strict";
    class EventNest {
        constructor(sender) {
            this._handlers = [];
            this._sender = sender;
        }
        // Заглушка для ситуац. когда ожидаемый объект источник события - отсутствует
        static getStub() {
            return new EventNest(null);
        }
        subscribe(handler) {
            // Один и тотже обраб. дважды и т.д. не подпишется.
            if (this._handlers.indexOf(handler) < 0) {
                this._handlers.push(handler);
            }
        }
        unsubscribe(handler) {
            let index = this._handlers.indexOf(handler);
            if (index >= 0) {
                this._handlers.splice(index, 1);
            }
        }
        // Насколько тут правильные this и т.п. - пока не ясно!
        raise(args) {
            this._handlers.forEach((handler) => {
                handler(this._sender, args);
            });
        }
    }
    VSect.EventNest = EventNest;
})(VSect || (VSect = {})); // namespace MasterDetailApp
var VSect;
(function (VSect) {
    "use strict";
    class PageNavigator {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor() {
            this._bPageChanging = false;
            this._cacheDisplayedPages = new VSect.KeyedCache();
            this._eventPageChanged = new VSect.EventNest(this);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        assocPageHost(vePageHost) {
            vePageHost.innerHTML = "";
            this._htePageHost = vePageHost;
        }
        updateLayout() {
            if (this._pageCurrent) {
                this._pageCurrent.updateLayout();
            }
        }
        // Public Members
        // -------------------------------------------------------------------
        get current() {
            return this._pageCurrent;
        }
        checkPageCurrent(page) {
            let bCurrent = false;
            if (page && this._pageCurrent) {
                if (VSect.Helper.isString(page)) {
                    bCurrent = (this._pageCurrent.uri === page);
                }
                else {
                    bCurrent = (this._pageCurrent === page);
                }
            }
            //
            return bCurrent;
        }
        navigate(pageNavigating) {
            if (this.checkPageCurrent(pageNavigating)) {
                return;
            }
            //
            const _this = this;
            this._pageNext = pageNavigating;
            pageNavigating.requestNavigation().then((pageReady) => {
                processReadyPage(pageReady);
            }, (pageCurrupted) => {
                // в любом случае отображаем
                processReadyPage(pageCurrupted);
            });
            // Inline
            function processReadyPage(page) {
                if (page === _this._pageNext) {
                    _this._setWaitingPage();
                }
                else {
                    page.notifyRejection();
                }
            }
        }
        forceDiscardPage(pageTarget, pageAlternate, bForceAlternate = false) {
            if (this._htePageHost && this._cacheDisplayedPages.contains(pageTarget.uri)) {
                // Текущая ли страница?
                pageTarget.forceLifeMode(VSect.PageLifeModes.Discard);
                if (this.checkPageCurrent(pageTarget)) {
                    this.navigate(pageAlternate);
                }
                else {
                    this._cacheDisplayedPages.release(pageTarget.uri);
                    this._htePageHost.removeChild(pageTarget.presenter);
                }
            }
        }
        get eventPageChanged() {
            return this._eventPageChanged;
        }
        // Internal Members
        // -------------------------------------------------------------------
        _setWaitingPage() {
            this._pageWaiting = this._pageNext;
            this._pageNext = undefined;
            //
            setTimeout(() => {
                if (!this._bPageChanging) {
                    this._displayPage();
                }
            }, 0);
        }
        _displayPage() {
            if (this._pageComing) {
                // Это ошибка!!!
                return;
            }
            if (!this._pageWaiting || !this._pageWaiting.hasPresenter) {
                // Это ошибка!!!
                return;
            }
            //
            //
            this._bPageChanging = true;
            //
            this._pageComing = this._pageWaiting;
            this._pageWaiting = undefined;
            //
            let htePresenterOut = null;
            let htePresenterIn = null;
            let eventArgs = { pageNew: this._pageComing, pageOld: null };
            //
            // УДАЛЯЕМ ТЕКУЩУЮ СТРАНИЦУ
            const htePageHost = this._htePageHost; // точно знаем, что презентер валидный!
            if (this._pageCurrent) {
                htePresenterOut = this._pageCurrent.presenter;
                //
                eventArgs.pageOld = this._pageCurrent;
                this._pageCurrent = undefined;
            }
            // РАЗМЕЩАЕМ НОВУЮ СТРАНИЦУ!
            this._pageCurrent = this._pageComing;
            this._pageComing = undefined;
            //
            htePresenterIn = this._pageCurrent.presenter;
            //
            if (!this._cacheDisplayedPages.contains(this._pageCurrent.uri)) { // может уже присутствовать если Held
                this._cacheDisplayedPages.cache(this._pageCurrent.uri, this._pageCurrent);
                htePageHost.appendChild(htePresenterIn);
                // processContent - это единовременная обработка своих конструкций перед отображением страницы
                if (this._pageCurrent.isProcessed) {
                    this._pageCurrent.notifyAttached();
                }
                else {
                    this._pageCurrent.processContent().then(() => {
                        this._pageCurrent.notifyAttached();
                    }, (err) => {
                        // нужно обработать ошибку
                        this._pageCurrent.notifyAttached();
                    });
                }
            }
            // ОТОБРАЖАЕМ ПЕРЕХОД МЕЖДУ СТРАНИЦАМИ!
            eventArgs.pageNew = this._pageCurrent;
            this._eventPageChanged.raise(eventArgs); // факт. смена страниц произошла - сообщаем (возм. надо raiseAsync)
            //
            if (htePresenterOut) {
                // раз есть предыдущ. страница - надо анимировать переход
                const eDirection = (eventArgs.pageNew instanceof VSect.MasterPage) ? VSect.TransDirections.Backward : VSect.TransDirections.Forward;
                /*
                Вот так можно создать глюк (анимация не работает)
                (<HTMLElement>this._htePageHost).removeChild(htePresenterOut);
                но как обработать такую ситуацию - ПОКА НЕПОНЯТНО!
                Пока без проверки на глюк.
                */
                this._animateTransit($(htePresenterOut), $(htePresenterIn), eDirection).then(() => {
                    __releasePage(this, eventArgs.pageOld);
                    this._bPageChanging = false;
                    this._checkWaitingPage();
                });
            }
            else {
                htePresenterIn.classList.add("current");
                this._bPageChanging = false;
                this._checkWaitingPage();
            }
            //
            function __releasePage(ctx, page) {
                if (page) {
                    if (page.life !== VSect.PageLifeModes.Held) {
                        page.notifyDetached();
                        ctx._cacheDisplayedPages.release(page.uri);
                        ctx._htePageHost.removeChild(page.presenter);
                    }
                    else {
                        page.notifyPassive();
                    }
                }
            } // __releasePage
        }
        _animateTransit($pageOut, $pageIn, eDirection) {
            return new Promise((handlComplete) => {
                let strOutAnimClass = "";
                let strInAnimClass = "";
                switch (eDirection) {
                    case VSect.TransDirections.Forward: {
                        strOutAnimClass = "trans-moveToLeft";
                        strInAnimClass = "trans-moveFromRight";
                        break;
                    }
                    case VSect.TransDirections.Backward: {
                        strOutAnimClass = "trans-moveToRight";
                        strInAnimClass = "trans-moveFromLeft";
                        break;
                    }
                }
                //
                let bOutDone = false;
                let bInDone = false;
                $pageOut.addClass(strOutAnimClass).on(VSect.Helper.strAnimEndEventName, () => {
                    $pageOut.off(VSect.Helper.strAnimEndEventName);
                    bOutDone = true;
                    if (bInDone) {
                        __onEndAnimation();
                        handlComplete();
                    }
                });
                $pageIn.addClass(strInAnimClass + " current").on(VSect.Helper.strAnimEndEventName, () => {
                    $pageIn.off(VSect.Helper.strAnimEndEventName);
                    bInDone = true;
                    if (bOutDone) {
                        __onEndAnimation();
                        handlComplete();
                    }
                });
                //
                // 
                function __onEndAnimation() {
                    bOutDone = false;
                    bInDone = false;
                    //
                    $pageOut.attr("class", $pageOut.data("origClasses"));
                    $pageIn.attr("class", $pageIn.data("origClasses") + " current");
                }
            });
        }
        _checkWaitingPage() {
            setTimeout(() => {
                if (this._pageWaiting && !this._bPageChanging) {
                    this._displayPage();
                }
            }, 0);
        }
    } // PageNavigator
    VSect.PageNavigator = PageNavigator;
})(VSect || (VSect = {})); // namespace MasterDetailApp
/// <reference path="./navigator.ts" />
var VSect;
/// <reference path="./navigator.ts" />
(function (VSect) {
    "use strict";
    class MainView /* implements IPageNavigation */ {
        // Infrastructure
        // -------------------------------------------------------------------
        static launch(path) {
            if (this._testCompatibility()) {
                this._presenter = document.querySelector(".app-mainview");
                if (this._presenter) {
                    this._nav.assocPageHost(this._presenter);
                    this._nav.eventPageChanged.subscribe(this._onPageChanged);
                    //
                    VSect.FullScreenToggler.init(document);
                    //
                    let $splashscreen = $(".app-splashscreen");
                    setTimeout(() => {
                        $splashscreen.fadeOut("slow", () => {
                            $splashscreen.css("display", "none");
                        });
                    }, 1500);
                }
                //
                // Загружаем главную страницу
                //
                this._pageMaster = new VSect.MasterPage(path);
                this.toMasterPage();
            }
            else {
                // Браузер устаревший!
                const strScreenHTML = `<div class="app-incompatible"> 
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
        static toMasterPage() {
            this._nav.navigate(this._pageMaster);
        }
        static toPage(path, hteLink = null) {
            let page;
            if (this._cachePages.contains(path)) {
                page = this._cachePages.get(path);
            }
            else {
                page = new VSect.DetailPage(this._pageMaster, path, this._fetchLifeMode(hteLink)); // Grigory 16-Mar-2020.
                //
                if (page && page.life !== VSect.PageLifeModes.Discard) {
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
        static _testCompatibility() {
            let test = window.Modernizr;
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
        static _fetchLifeMode(hte) {
            let mode = VSect.PageLifeModes.Persistent;
            //
            if (hte && hte.dataset.life) {
                switch (hte.dataset.life.toLowerCase()) {
                    case "discard": {
                        mode = VSect.PageLifeModes.Discard;
                        break;
                    }
                    case "held": {
                        mode = VSect.PageLifeModes.Held;
                        break;
                    }
                }
            }
            //
            return mode;
        }
        static _setLinkLastActive(link) {
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
        static _onPageChanged(sender, args) {
            // if (args.pageNew) {
            // 	console.log("Смена страниц: " + args.pageNew.uri);
            // }
        }
    } // class MainView
    // Class Variables and Constants
    // -------------------------------------------------------------------
    MainView._nav = new VSect.PageNavigator();
    MainView._cachePages = new VSect.KeyedCache();
    MainView._hteLinkLastActive = null;
    VSect.MainView = MainView;
})(VSect || (VSect = {})); // namespace MasterDetailApp
///<reference path="./../events.ts" />
///<reference path="./../common.ts" />
var MediaSyncMachine;
///<reference path="./../events.ts" />
///<reference path="./../common.ts" />
(function (MediaSyncMachine) {
    "use strict";
    class SyncUtils {
        static toSyncUnits(strValue) {
            let nResult = 0;
            //
            let a = strValue.split(":");
            if (a.length > 1) {
                // не отлажено!!!
                for (let i = 0; i < a.length; i++) {
                    let strVal = a[a.length - (i + 1)];
                    switch (i) {
                        case 0: {
                            // секунды
                            nResult = parseFloat(strVal);
                            break;
                        }
                        case 1: {
                            // минуты
                            nResult += (parseInt(strVal, 10) * 60); // 60 сек в мин.
                            break;
                        }
                        case 3: {
                            // часы
                            nResult += (parseInt(strVal, 10) * 3600); // 3600 сек в часе
                            break;
                        }
                    }
                }
            }
            else {
                nResult = parseFloat(strValue);
            }
            //
            return nResult;
        }
        static getVertOffset(elem, elemTarget) {
            /* Это пример из интернета
            function offset(el) {
                var rect = el.getBoundingClientRect(),
                scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
            }
            */
            return elem.getBoundingClientRect().top - elemTarget.getBoundingClientRect().top;
        }
        static get sepfactor() {
            if (this._nSepFactor < 0) {
                const strFontSize = getComputedStyle(document.documentElement).fontSize;
                this._nSepFactor = strFontSize ? parseFloat(strFontSize) : 16;
            }
            //
            return this._nSepFactor;
        }
    } // class SyncUtils 
    SyncUtils._nSepFactor = -1;
    MediaSyncMachine.SyncUtils = SyncUtils;
    class MediaActor {
        // с именем идентификатором и т.п. - пока не ясно...
        constructor(strName) {
            this._bDefault = false;
            if (strName) {
                this._strName = strName;
            }
            else {
                this._strName = "Actor";
                this._bDefault = true;
            }
        }
        get isDefault() {
            return this._bDefault;
        }
    } // class MediaActor
    MediaSyncMachine.MediaActor = MediaActor;
    /** Пока практически не используется. Возможно в перпективе будет иметь смысл разделять текст и объекты. */
    let SyncMarkKinds;
    (function (SyncMarkKinds) {
        SyncMarkKinds[SyncMarkKinds["Text"] = 0] = "Text";
        SyncMarkKinds[SyncMarkKinds["Object"] = 1] = "Object";
    })(SyncMarkKinds = MediaSyncMachine.SyncMarkKinds || (MediaSyncMachine.SyncMarkKinds = {}));
    class SyncMark {
        constructor(hteMark) {
            this._kind = SyncMarkKinds.Text;
            this._hteMark = hteMark;
            this._bSelected = false;
            this._bHighlighted = false;
            switch (this._hteMark.dataset.kind) {
                case "obj":
                case "object": {
                    this._kind = SyncMarkKinds.Object;
                    break;
                }
            }
            // Grigory. 13-Jan-2020 Переход на один клик для активации синх. элементов
            // hteMark.ondblclick = (ev: Event) => {
            // 	if (this._entry) {
            // 		this._entry.context.area.selectMe(this._entry);
            // 	}
            // };
            // Если один раз нажали на выделенный элемент, то просим его озвучить.
            // Посылать "selectMe" в этом случае - коряво. Это временное решение.
            // Позже надо всё это доводить до ума.
            hteMark.onclick = (ev) => {
                // if (this._entry && (this._bSelected || this._bHighlighted)) {
                // 	this._entry.context.area.selectMe(this._entry);
                // }
                if (this._entry) {
                    this._entry.context.area.selectMe(this._entry);
                }
            };
        }
        //
        assoc(entry) {
            this._entry = entry;
        }
        get hasAssoc() {
            return !!(this._entry);
        }
        //
        get selected() {
            return this._bSelected;
        }
        set selected(value) {
            this._bSelected = value;
            if (this._bSelected) {
                this._hteMark.classList.add("selected");
            }
            else {
                this._hteMark.classList.remove("selected");
            }
        }
        highlightOn() {
            this._bHighlighted = true;
            switch (this._kind) {
                case SyncMarkKinds.Object: {
                    this._hteMark.classList.add("highlighted");
                    break;
                }
                default: {
                    this._hteMark.classList.add("highlighted");
                    break;
                }
            }
        }
        highlightOff() {
            this._bHighlighted = false;
            switch (this._kind) {
                case SyncMarkKinds.Object: {
                    this._hteMark.classList.remove("highlighted");
                    break;
                }
                default: {
                    this._hteMark.classList.remove("highlighted");
                    break;
                }
            }
        }
        get isHighlighted() {
            return this._bHighlighted;
        }
        //
        get presenter() {
            return this._hteMark;
        }
    } // class SyncMark
    MediaSyncMachine.SyncMark = SyncMark;
    class SyncRange {
        constructor(entry, data) {
            this._nStartIn = -1; // если -1, то считается нет значения.
            this._nEndIn = -1;
            this._nStartOut = -1;
            this._nEndOut = -1;
            this._bOutSpreaded = false;
            this._nStartInSaved = -1;
            this._nEndInSaved = -1;
            this._entry = entry;
            //
            if (data instanceof HTMLElement) {
                const hteData = data;
                //
                this._actor = new MediaActor(hteData.dataset.actor);
                if (hteData.dataset.src) {
                    // Это диктор (только выход) значит только out.
                    if (hteData.dataset.out) {
                        let aValues = hteData.dataset.out.split(";");
                        if (aValues.length === 2) {
                            this._nStartOut = SyncUtils.toSyncUnits(aValues[0]);
                            this._nEndOut = SyncUtils.toSyncUnits(aValues[1]);
                        } // else - неправильный формат!!!
                    }
                }
                else {
                    if (hteData.dataset.in) {
                        // в этом случае "in" должен быть обязательно
                        let aIn = hteData.dataset.in.split(";");
                        if (aIn.length === 2) {
                            this._nStartIn = SyncUtils.toSyncUnits(aIn[0]);
                            this._nEndIn = SyncUtils.toSyncUnits(aIn[1]);
                            //
                            if (hteData.dataset.out) {
                                let aOut = hteData.dataset.out.split(";");
                                if (aOut.length === 2) {
                                    this._nStartOut = SyncUtils.toSyncUnits(aOut[0]);
                                    this._nEndOut = SyncUtils.toSyncUnits(aOut[1]);
                                }
                            }
                            else {
                                // тоже что и "in"
                                this._nStartOut = this._nStartIn;
                                this._nEndOut = this._nEndIn;
                            }
                        } // else - неправильный формат!!!
                    }
                }
            }
            else {
                // JSon формат пока не поддерживается (вероятно потом)
                this._actor = new MediaActor(undefined);
            }
        }
        get entry() {
            return this._entry;
        }
        /** Включается в диапазон! */
        get startIn() {
            // return this._nStartIn;
            return (this._nStartIn - this._entry.context.factorIn);
        }
        /** Не включается в диапазон! */
        get endIn() {
            // по идее менять _nEndIn с учётом фактора надо в завис от FactorInStrategy:
            // ShiftRange или ShiftStart (пока пробуем ShiftStart поэтому _nEndIn не меняем)
            return this._nEndIn;
        }
        get startOut() {
            return this._nStartOut;
        }
        get endOut() {
            return this._nEndOut;
        }
        get isValid() {
            return (this._nStartIn >= 0 && this._nEndIn > this._nStartIn);
        }
        contains(pos) {
            // return (pos >= this._nStartIn && pos < this._nEndIn);
            return (pos >= this.startIn && pos < this.endIn);
        }
        spreadOut() {
            if (!this._bOutSpreaded) {
                this._bOutSpreaded = true;
                //
                this._nStartInSaved = this._nStartIn;
                this._nEndInSaved = this._nEndIn;
                //
                this._nStartIn = this._nStartOut;
                this._nEndIn = this._nEndOut;
            }
        }
        restoreIn() {
            if (this._bOutSpreaded) {
                this._bOutSpreaded = false;
                this._nStartIn = this._nStartInSaved;
                this._nEndIn = this._nEndInSaved;
            }
        }
    } // class SyncRange
    MediaSyncMachine.SyncRange = SyncRange;
    let SyncEntryStatuses;
    (function (SyncEntryStatuses) {
        SyncEntryStatuses[SyncEntryStatuses["None"] = 0] = "None";
        SyncEntryStatuses[SyncEntryStatuses["Ready"] = 1] = "Ready";
        SyncEntryStatuses[SyncEntryStatuses["Playing"] = 2] = "Playing";
    })(SyncEntryStatuses = MediaSyncMachine.SyncEntryStatuses || (MediaSyncMachine.SyncEntryStatuses = {}));
    class SyncEntry {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(context, data) {
            // Public Events
            // -------------------------------------------------------------------
            // Internal Members
            // -------------------------------------------------------------------
            // Event Handlers
            // -------------------------------------------------------------------
            // Entry Status
            // -------------------------------------------------------------------
            this._status = SyncEntryStatuses.None;
            this._context = context;
            this._aStreamRanges = [];
            this._aSpeakerRanges = [];
            if (data instanceof HTMLElement) {
                const hteData = data;
                const ranges = hteData.querySelectorAll(".range");
                //
                // сначала диапазоны синх. с медиаисточниками
                ranges.forEach((hteRange) => {
                    if (!hteRange.dataset.src) {
                        this._aStreamRanges.push(new SyncRange(this, hteRange));
                    }
                });
                // теперь диапазоны с дикторами
                ranges.forEach((hteRange) => {
                    if (hteRange.dataset.src) {
                        this._aSpeakerRanges.push(new SyncRange(this, hteRange));
                    }
                });
            }
            else {
                // JSon формат пока не поддерживается (вероятно потом)
            }
            //
            this._bSelected = false;
        }
        // Infrastructure
        // -------------------------------------------------------------------
        assoc(mark) {
            this._mark = mark;
        }
        get hasAssoc() {
            return !!(this._mark);
        }
        getAssocPresenter() {
            return (this._mark) ? this._mark.presenter : undefined;
        }
        // Public Members
        // -------------------------------------------------------------------
        get context() {
            return this._context;
        }
        get mark() {
            return (this._mark) ? this._mark : null;
        }
        getRange(nStreamIndex) {
            let range = null;
            //
            if (nStreamIndex >= 0 && nStreamIndex < this._aStreamRanges.length) {
                range = this._aStreamRanges[nStreamIndex];
            }
            //
            return range;
        }
        get isSelected() {
            return this._bSelected;
        }
        select(bSelected = true) {
            this._bSelected = bSelected;
            if (this._bSelected) {
                if (this._mark) {
                    // this._mark.presenter.classList.add("selected");
                    this._mark.selected = bSelected;
                }
                //
                this._aStreamRanges.forEach((range) => {
                    range.spreadOut();
                });
            }
            else {
                if (this._mark) {
                    // this._mark.presenter.classList.remove("selected");
                    this._mark.selected = bSelected;
                }
                //
                this._aStreamRanges.forEach((range) => {
                    range.restoreIn();
                });
            }
        }
        get status() {
            return this._status;
        }
        changeStatus(status) {
            if (this._status === status) {
                return;
            }
            //
            const statusOld = this._status;
            this._status = status;
            //
            // this._context.scope.indicateMe(this); // Теперь это делает SyncMedia!
            //
            switch (this._status) {
                case SyncEntryStatuses.Ready: {
                    break;
                }
                case SyncEntryStatuses.Playing: {
                    if (this._mark) {
                        this._mark.highlightOn();
                    }
                    break;
                }
                default: {
                    // SyncEntryStates.None
                    if (this._bSelected) {
                        //
                    }
                    if (this._mark) {
                        this._mark.highlightOff();
                    }
                    break;
                }
            }
        }
    } // class SyncEntry
    MediaSyncMachine.SyncEntry = SyncEntry;
    class SyncContext {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(area, presenter) {
            this._area = area;
            this._presenter = presenter;
            this._marks = [];
            this._entries = [];
            //
            this._nFactorIn = (presenter.dataset.factorIn) ? parseFloat(presenter.dataset.factorIn) : 0;
            this._nFactorOut = (presenter.dataset.factorOut) ? parseFloat(presenter.dataset.factorOut) : 0;
            //
            let hteSyncText = presenter.querySelector(".sync-text");
            if (hteSyncText) {
                const listMarks = hteSyncText.querySelectorAll("mark");
                const listEntries = presenter.querySelectorAll(".sync-info>.sync-entry");
                const nAssocMarkCount = Math.min(listMarks.length, listEntries.length);
                for (let i = 0; i < nAssocMarkCount; i++) {
                    const mark = new SyncMark(listMarks[i]);
                    this._marks.push(mark);
                    const entry = new SyncEntry(this, listEntries[i]);
                    this._entries.push(entry);
                    mark.assoc(entry);
                    entry.assoc(mark);
                }
            }
            //
            // Sensor
            //
            this._bActive = false;
            this._hteSensor = document.createElement("div");
            this._hteSensor.classList.add("sensor");
            const divIndicator = document.createElement("div");
            divIndicator.classList.add("indicator");
            this._hteSensor.appendChild(divIndicator);
            presenter.insertBefore(this._hteSensor, null);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        // Public Members
        // -------------------------------------------------------------------
        /*
         Вообще, не очень хорошо выставлять на ружу изменяемый массив, надо делать свой собственный перебор entry.
         */
        get entries() {
            return this._entries;
        }
        get sensor() {
            return this._hteSensor;
        }
        get isActive() {
            return this._bActive;
        }
        setActive(bIsActive) {
            this._bActive = bIsActive;
            if (this._bActive) {
                this._hteSensor.classList.add("active");
            }
            else {
                this._hteSensor.classList.remove("active");
            }
        }
        get factorIn() {
            return this._nFactorIn;
        }
        get factorOut() {
            return this._nFactorOut;
        }
        // Public Events
        // -------------------------------------------------------------------
        get area() {
            return this._area;
        }
    } // class SyncContext
    MediaSyncMachine.SyncContext = SyncContext;
    let SyncMediaStates;
    (function (SyncMediaStates) {
        SyncMediaStates[SyncMediaStates["Init"] = 0] = "Init";
        SyncMediaStates[SyncMediaStates["Stopped"] = 1] = "Stopped";
        SyncMediaStates[SyncMediaStates["Paused"] = 2] = "Paused";
        SyncMediaStates[SyncMediaStates["Playing"] = 3] = "Playing";
        SyncMediaStates[SyncMediaStates["Waiting"] = 4] = "Waiting";
        SyncMediaStates[SyncMediaStates["Error"] = 5] = "Error";
    })(SyncMediaStates = MediaSyncMachine.SyncMediaStates || (MediaSyncMachine.SyncMediaStates = {}));
    let SyncMediaModes;
    (function (SyncMediaModes) {
        SyncMediaModes[SyncMediaModes["Normal"] = 0] = "Normal";
        SyncMediaModes[SyncMediaModes["Managed"] = 1] = "Managed";
    })(SyncMediaModes || (SyncMediaModes = {}));
    let SyncRelPositions;
    (function (SyncRelPositions) {
        SyncRelPositions[SyncRelPositions["Before"] = 0] = "Before";
        SyncRelPositions[SyncRelPositions["Attention"] = 1] = "Attention";
        SyncRelPositions[SyncRelPositions["Ready"] = 2] = "Ready";
        SyncRelPositions[SyncRelPositions["Playing"] = 3] = "Playing";
        SyncRelPositions[SyncRelPositions["After"] = 4] = "After";
    })(SyncRelPositions || (SyncRelPositions = {}));
    class SyncMedia {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(area, media) {
            this._suDeferralStart = 0; // если при старте больше 0, то позиционир.
            this._nRequestID = 0; // для cancelAnimationFrame
            // Internal Members
            // -------------------------------------------------------------------
            this._bSyncHandlerBusy = false; // experimental!
            // State Machine
            // -------------------------------------------------------------------
            //
            // Playing States
            //
            this._state = SyncMediaStates.Init;
            this._statePrev = SyncMediaStates.Init;
            //
            // Working Modes
            //
            this._mode = SyncMediaModes.Normal;
            this._area = area;
            this._media = media;
            this._bActive = false; // SyncMedia Status
            this._ranges = [];
            this._ranSelected = null;
            //
            this._ranPlaying = null;
            this._nProbeStart = -1;
            //
            this._eventMediaStateChanged = new VSect.EventNest(this);
            //
            // Media Events Handle
            //
            this._bPlaying = false;
            this._media.onload = (event) => {
                this._changeState(SyncMediaStates.Stopped); // не уверен???!!!
            };
            this._media.onerror = (event) => {
                this._changeState(SyncMediaStates.Error);
            };
            this._media.onplay = (event) => {
                // console.log("_media.onplay");
                // дело в том, что эксперимент. путём установлено, что _media.onplaying вызывается всегда.
                // this._changeState(SyncMediaStates.Playing);
            };
            this._media.onplaying = (event) => {
                this._changeState(SyncMediaStates.Playing);
            };
            this._media.onpause = (event) => {
                this._changeState(SyncMediaStates.Paused);
            };
            this._media.onended = (event) => {
                this._media.currentTime = 0;
                // как я понял, у MediaElement нет ф. Stop, а только "пауза". Получается это довольно
                // вырожденная ситуация (попробую оставить так, а там видно будет). Т.е. "стоп" в нашем 
                // случае, означает: "пауза" + "currentTime = 0"
                this._changeState(SyncMediaStates.Stopped);
            };
            this._media.onwaiting = (event) => {
                this._changeState(SyncMediaStates.Waiting);
            };
            this._media.onseeked = (event) => {
                if (!this._ranSelected) {
                    // сбрасываем если _ranSelected не установлен (вообще нужно ли onseeked обрабатывать?!)
                    this._setProbeStartIndex(-1);
                }
            };
            this._media.ontimeupdate = (event) => {
                // только когда нет проигрывания
                if (!(this.state === SyncMediaStates.Playing)) {
                    this._updateSyncState(this._media.currentTime);
                }
            };
        }
        // Infrastructure
        // -------------------------------------------------------------------
        regRange(range) {
            if (range && range.isValid) {
                this._ranges.push(range);
            }
        }
        completeReg() {
            // сортируем диапазоны по возрастанию
            this._ranges.sort((a, b) => {
                return (a.startIn === b.startIn) ? 0 : (a.startIn < b.startIn) ? -1 : 1;
            });
        }
        setActiveStatus(bActive) {
            this._bActive = bActive;
            if (this._bActive) {
                this._updateSyncState(this._media.currentTime);
            }
            else {
                this._updateSyncState(SyncMedia.NOTIME);
            }
        }
        selectRange(range) {
            const _this = this;
            //
            if (range && range === this._ranSelected) {
                if (this.state === SyncMediaStates.Playing) {
                    this.pause();
                    __positionSelected(this._ranSelected);
                }
                else {
                    __positionSelected(this._ranSelected);
                    this.play();
                }
                //
                return;
            }
            //
            if (this.isPlaying) {
                this.pause();
            }
            //
            if (this._ranSelected) {
                this._ranSelected.entry.select(false);
            }
            //
            this._ranSelected = range;
            if (this._ranSelected) {
                this._ranSelected.entry.select(true);
                __positionSelected(this._ranSelected);
                //
                if ((this._ranSelected === this._ranPlaying) && (this._state !== SyncMediaStates.Playing)) {
                    // experemental
                    this.play();
                }
            }
            // Grigory. Experimental
            if (isNaN(this._media.duration)) {
                this._media.preload = "auto";
                this._media.load();
            }
            //
            //
            function __positionSelected(ranSelected) {
                _this._setProbeStartIndex(_this._ranges.indexOf(ranSelected));
                _this.forcePosition(ranSelected.startOut);
            }
        }
        get isActive() {
            return this._bActive;
        }
        get isPlaying() {
            return this._bPlaying;
        }
        get mediaelement() {
            return this._media;
        }
        pause() {
            this._media.pause();
        }
        play() {
            this._media.play();
        }
        forcePosition(suPos) {
            // experimental (раньше я не проверял!)
            if (isNaN(this._media.duration)) {
                this._suDeferralStart = suPos;
            }
            else {
                this._media.currentTime = suPos;
            }
        }
        // Public Events
        // -------------------------------------------------------------------
        get eventMediaStateChanged() {
            return this._eventMediaStateChanged;
        }
        _updateSyncState(suTimeNow) {
            if (!this.isActive) {
                return;
            }
            //
            if (this._bSyncHandlerBusy) {
                // console.log("SyncHandle is Busy");
                return;
            }
            //
            this._bSyncHandlerBusy = true;
            switch (this._state) {
                case SyncMediaStates.Playing:
                case SyncMediaStates.Stopped:
                case SyncMediaStates.Paused: {
                    const nProbeStart = (this._nProbeStart >= 0) ? this._nProbeStart : this._findProbeStartIndex(suTimeNow);
                    if (nProbeStart >= 0) {
                        this._probePositionStraight(nProbeStart, suTimeNow);
                    }
                    else {
                        this._setRangePlaying(null);
                        this._setProbeStartIndex(nProbeStart);
                    }
                    break;
                }
            } // switch
            this._bSyncHandlerBusy = false;
        }
        _probePositionStraight(nIndexStart, suTimeNow) {
            let ranAttention = null;
            let nAttentionIndex = -1;
            let ranReady = null;
            let ranNow = null;
            let nNowIndex = -1;
            //
            // Будем искать вперёд все подряд, пока nTimeNow будет меньше конца очередного диапазона или достигнут конец
            //
            if (nIndexStart < 0) {
                nIndexStart = 0;
            }
            for (let i = nIndexStart; i < this._ranges.length; i++) {
                let ran = this._ranges[i];
                let relpos = this._testRangeRelPosition(suTimeNow, ran);
                if (relpos === SyncRelPositions.After) { // т.е. ran находится за (выше) временной метки
                    // тек. диапаз. наход. за временной меткой - дальше зондировать нет смысла
                    break;
                }
                //
                switch (relpos) {
                    case SyncRelPositions.Attention: {
                        ranAttention = ran;
                        nAttentionIndex = i;
                        break;
                    }
                    case SyncRelPositions.Ready: {
                        ranReady = ran;
                        break;
                    }
                    case SyncRelPositions.Playing: {
                        ranNow = ran;
                        nNowIndex = i;
                        break;
                    }
                    case SyncRelPositions.Before: {
                        // запоминаем нижний порог для след. зондирования, он не понадобится если
                        // оба диапазона (и Ready и Now) будут найдены (тогда возьмём: Math.min(nReadyIndex, nNowIndex)) 
                        nIndexStart = i;
                        // т.к. тек. диапаз. наход. перед временной меткой - продолжаем зондировать
                        break;
                    }
                } // switch
            } // for
            //
            // Теперь, по результатам зондирования обновляем переменные
            //
            // первое Attention: отображаем если нет ничего другого и если предудущий диапазон отстаит от этого
            // более чём на 3 секунды
            if (ranAttention &&
                !(this._ranPlaying || ranNow || ranReady) &&
                !(nAttentionIndex > 0 && ((ranAttention.startIn - this._ranges[nAttentionIndex - 1].endIn) < SyncMedia.SYNC_ATTENTION_DISTANCE))) {
                // ещё одна проверочка
                if (suTimeNow < ((ranAttention.startIn - SyncMedia.SYNC_ATTENTION_OFFSET) + 1)) {
                    // т.е. если Attention нах. в диапазоне секунды от нижнего своего порога, только тогда сигнализир.
                    this._area.indicateAttention(ranAttention.entry);
                }
            }
            //
            // ranPlaying
            this._setRangePlaying(ranNow);
            this._setProbeStartIndex((ranNow) ? nNowIndex : nIndexStart);
            //
            // ranReady (может наложиться на ranPlaying - ничего страшного)
            if (ranReady) {
                this._area.indicatePlaying(ranReady.entry);
            }
        }
        _setRangePlaying(range) {
            if (this._ranPlaying === range) {
                if (this._ranPlaying && this._statePrev !== SyncMediaStates.Playing) {
                    this._area.indicatePlaying(this._ranPlaying.entry);
                }
                return;
            }
            //
            if (this._ranPlaying) {
                // !!! ??? Пока я не учитываю режим изолированного прослушивания выделнного вхождения
                if (this._ranSelected && this._ranSelected !== range) {
                    this._ranSelected.entry.select(false);
                    this._ranSelected = null;
                }
                this._ranPlaying.entry.changeStatus(SyncEntryStatuses.None);
                if (!range) {
                    // только если нет след диапазона
                    this._area.hideEntryPlaying();
                }
            }
            //
            this._ranPlaying = range;
            if (this._ranPlaying) {
                this._area.indicatePlaying(this._ranPlaying.entry);
                this._ranPlaying.entry.changeStatus(SyncEntryStatuses.Playing);
            }
        }
        _setProbeStartIndex(nIndexNew) {
            this._nProbeStart = nIndexNew;
        }
        _testWithinRange(suTimePos, range) {
            return (suTimePos < range.endIn && (suTimePos >= (range.startIn - SyncMedia.SYNC_READY_OFFSET)));
        }
        _findProbeStartIndex(suTimePos) {
            let nProbeStartIndex = -1;
            let nIndexLower = 0;
            let nIndexUpper = this._ranges.length;
            while (true) {
                // пока надеемся, что вых. из бесконечного цмкла произойдёт по одному из break!!!???
                if (nIndexLower >= nIndexUpper) {
                    // т.е. конец зондирования
                    break;
                }
                let nIndexMiddle = (nIndexLower + Math.floor(((nIndexUpper - nIndexLower) / 2)));
                let ranMiddle = this._ranges[nIndexMiddle];
                if (this._testWithinRange(suTimePos, ranMiddle)) {
                    nProbeStartIndex = nIndexMiddle;
                    break;
                }
                else {
                    if (suTimePos < ranMiddle.startIn) {
                        // значит двигаемся вниз
                        nIndexUpper = nIndexMiddle;
                    }
                    else {
                        // значит двигаемся вверх
                        nIndexLower = (nIndexMiddle + 1);
                    }
                }
            } // while
            //
            // т.е. если диапазон не найден но в дан. момент Playing, то возвр. ближайший нижний индекс получ. при поиске
            return (nProbeStartIndex >= 0) ? nProbeStartIndex : (this._state === SyncMediaStates.Playing) ? nIndexLower : nProbeStartIndex;
        }
        /** Возвращает позицию дипазона относ. временной метки */
        _testRangeRelPosition(suTimePos, ran) {
            if (suTimePos >= ran.endIn) {
                return SyncRelPositions.Before;
            }
            //
            if (suTimePos < (ran.startIn - SyncMedia.SYNC_ATTENTION_OFFSET)) {
                return SyncRelPositions.After; // т.е. диапазон после метки
            }
            //
            if (ran.contains(suTimePos)) {
                return SyncRelPositions.Playing;
            }
            //
            return (suTimePos >= (ran.startIn - SyncMedia.SYNC_READY_OFFSET)) ? SyncRelPositions.Ready : SyncRelPositions.Attention;
        }
        _syncPosition(time) {
            this._updateSyncState(this._media.currentTime);
            if (this.state === SyncMediaStates.Playing) {
                this._nRequestID = requestAnimationFrame(this._syncPosition.bind(this));
            }
        }
        get state() {
            return this._state;
        }
        set state(stateNew) {
            this._statePrev = this._state;
            this._state = stateNew;
        }
        _changeState(stateNew) {
            if (this.state === stateNew) {
                return;
            }
            //
            const stateOld = this.state;
            this.state = stateNew;
            //
            const stateNow = this.state;
            switch (stateNow) {
                case SyncMediaStates.Stopped: {
                    this._bPlaying = false;
                    this._area.hideIndicationAll();
                    break;
                }
                case SyncMediaStates.Paused: {
                    this._bPlaying = false;
                    break;
                }
                case SyncMediaStates.Playing: {
                    this._bPlaying = true;
                    //
                    if (this._ranSelected && this._suDeferralStart > 0) {
                        this.forcePosition(this._suDeferralStart);
                        this._suDeferralStart = 0;
                    }
                    // Начинаем цикл синхронизации
                    this._nRequestID = requestAnimationFrame(this._syncPosition.bind(this));
                    //
                    break;
                }
                case SyncMediaStates.Error: {
                    this._bPlaying = false;
                    break;
                }
                default: {
                    break;
                }
            }
            //
            if ((stateNow !== SyncMediaStates.Playing) && (this._nRequestID > 0)) {
                cancelAnimationFrame(this._nRequestID);
                this._nRequestID = 0;
            }
            //
            if (this.state !== stateOld) {
                this._eventMediaStateChanged.raise(this.state);
            }
        }
    } // class SyncMedia
    // Public Members
    // -------------------------------------------------------------------
    SyncMedia.NOTIME = -1;
    SyncMedia.SYNC_READY_OFFSET = 0.2; // получено пробным путём
    SyncMedia.SYNC_ATTENTION_DISTANCE = 3;
    SyncMedia.SYNC_ATTENTION_OFFSET = 2;
    MediaSyncMachine.SyncMedia = SyncMedia;
    class SyncArea {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(presenter, scrollowner = null) {
            this._bAutoScroll = true;
            this._bAnimating = false;
            this._presenter = presenter;
            //
            if (presenter.dataset.scrollowner) {
                this._hteScrollOwner = presenter.querySelector(presenter.dataset.scrollowner);
            }
            else {
                this._hteScrollOwner = scrollowner;
            }
            this._$hteScrollOwner = (this._hteScrollOwner) ? $(this._hteScrollOwner) : $();
            //
            this._contexts = [];
            this._ctxPlaying = null;
            //
            this._nActiveMediaIndex = -1; // Может (отсчёт от нуля)
            this._mediaActive = null;
            let strAutoscroll = presenter.dataset.autoscroll;
            if (strAutoscroll) {
                this._bAutoScroll = (strAutoscroll.toLocaleLowerCase() === "true");
            }
            //
            // Подготавливаем индикаторы
            // вот так меняется видимость
            // svgIndicator.style.setProperty("visibility", "visible");
            // Ready Pointer
            const svgIndicatorReady = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIndicatorReady.classList.add("pointer-syncentry", "entryready");
            // svg без внутр. заливки
            // svgIndicatorReady.innerHTML = `<path d="m 16.865556,4.001 c -0.969,0 -1.654121,0.781 -1.654121,1.75 V 16.011179 H 14.372846 L 14.361127,7.7206447 C 14.359758,6.7516457 13.610482,6.001 12.641482,6.001 c -0.969,0 -1.75,0.781 -1.75,1.75 v 12.25 L 8.4854823,16.798 c -0.375,-0.5 -0.969,-0.797 -1.594,-0.797 -1.109,0 -2,0.906 -2,2 0,0.438 0.141,0.859 0.406,1.203 l 5.9999997,8 c 0.375,0.5 0.969,0.797 1.594,0.797 h 11.467036 c 0.719,0 1.344,-0.516 1.484,-1.219 l 1.188,-6.328 c 0.047,-0.297 0.078,-0.609 0.078,-0.922 v -7.781 c 0,-0.969 -0.781,-1.75 -1.75,-1.75 -0.969,0 -1.664142,0.781 -1.664142,1.75 l -0.0039,4.260179 H 22.88445 V 7.751 c 0,-0.969 -0.781,-1.75 -1.75,-1.75 -0.969,0 -1.599749,0.7595356 -1.599749,1.7285356 V 16.011179 H 18.619462 L 18.615556,5.751 c -3.69e-4,-0.9689999 -0.781,-1.75 -1.75,-1.75 z m 0,-2 c 1.406,0 2.971888,0.797 3.612888,2.063 0.219,-0.047 0.438,-0.063 0.656,-0.063 2.063,0 3.974074,1.687 3.974074,3.75 v 0.266 c 2.172,-0.125 4,1.547 4,3.734 v 7.781 c 0,0.438 -0.047,0.875 -0.125,1.297 l -1.188,6.312 c -0.297,1.656 -1.75,2.859 -3.437,2.859 H 12.891482 c -1.25,0 -2.453,-0.609 -3.2029997,-1.594 l -6,-8 c -0.516,-0.688 -0.797,-1.547 -0.797,-2.406 0,-2.203 1.781,-4 4,-4 0.656,0 1.453,0.156 2,0.531 V 7.75 c 0,-2.063 1.6869997,-3.75 3.7499997,-3.75 0.219,0 0.438,0.016 0.656,0.063 C 13.938482,2.797 15.458556,2 16.865556,2 Z" />`;
            svgIndicatorReady.innerHTML = `<g
			id="g4157">
		   <path
			  d="m 16.865555,3.9910716 c -0.969,0 -1.654121,0.781 -1.654121,1.75 l 0,10.2601794 -0.838589,0 -0.01172,-8.2905344 c -0.0014,-0.968999 -0.750644,-1.719645 -1.719644,-1.719645 -0.969,0 -1.75,0.781 -1.75,1.75 l 0,12.2500004 -2.4059997,-3.203 c -0.375,-0.5 -0.969,-0.797 -1.594,-0.797 -1.109,0 -2,0.906 -2,2 0,0.438 0.141,0.859 0.406,1.203 l 5.9999997,8 c 0.375,0.5 0.969,0.797 1.594,0.797 l 11.467036,0 c 0.719,0 1.344,-0.516 1.484,-1.219 l 1.188,-6.328 c 0.047,-0.297 0.078,-0.609 0.078,-0.922 l 0,-7.781 c 0,-0.969 -0.781,-1.7500005 -1.75,-1.7500005 -0.969,0 -1.664142,0.7810005 -1.664142,1.7500005 l -0.0039,4.260179 -0.806026,0 0,-8.2601794 c 0,-0.969 -0.781,-1.75 -1.75,-1.75 -0.969,0 -1.599749,0.759536 -1.599749,1.728536 l 0,8.2816434 -0.915239,0 -0.0039,-10.2601794 c -3.69e-4,-0.969 -0.781,-1.75 -1.75,-1.75 z"
			  id="path4155"
			  style="fill:#ffffff" />
		   <path
			  d="m 16.865556,4.001 c -0.969,0 -1.654121,0.781 -1.654121,1.75 V 16.011179 H 14.372846 L 14.361127,7.7206447 C 14.359758,6.7516457 13.610482,6.001 12.641482,6.001 c -0.969,0 -1.75,0.781 -1.75,1.75 v 12.25 L 8.4854823,16.798 c -0.375,-0.5 -0.969,-0.797 -1.594,-0.797 -1.109,0 -2,0.906 -2,2 0,0.438 0.141,0.859 0.406,1.203 l 5.9999997,8 c 0.375,0.5 0.969,0.797 1.594,0.797 h 11.467036 c 0.719,0 1.344,-0.516 1.484,-1.219 l 1.188,-6.328 c 0.047,-0.297 0.078,-0.609 0.078,-0.922 v -7.781 c 0,-0.969 -0.781,-1.75 -1.75,-1.75 -0.969,0 -1.664142,0.781 -1.664142,1.75 l -0.0039,4.260179 H 22.88445 V 7.751 c 0,-0.969 -0.781,-1.75 -1.75,-1.75 -0.969,0 -1.599749,0.7595356 -1.599749,1.7285356 V 16.011179 H 18.619462 L 18.615556,5.751 c -3.69e-4,-0.9689999 -0.781,-1.75 -1.75,-1.75 z m 0,-2 c 1.406,0 2.971888,0.797 3.612888,2.063 0.219,-0.047 0.438,-0.063 0.656,-0.063 2.063,0 3.974074,1.687 3.974074,3.75 v 0.266 c 2.172,-0.125 4,1.547 4,3.734 v 7.781 c 0,0.438 -0.047,0.875 -0.125,1.297 l -1.188,6.312 c -0.297,1.656 -1.75,2.859 -3.437,2.859 H 12.891482 c -1.25,0 -2.453,-0.609 -3.2029997,-1.594 l -6,-8 c -0.516,-0.688 -0.797,-1.547 -0.797,-2.406 0,-2.203 1.781,-4 4,-4 0.656,0 1.453,0.156 2,0.531 V 7.75 c 0,-2.063 1.6869997,-3.75 3.7499997,-3.75 0.219,0 0.438,0.016 0.656,0.063 C 13.938482,2.797 15.458556,2 16.865556,2 Z"
			  id="path4" />
		 </g>`;
            svgIndicatorReady.addEventListener("click", this._onContextSensorClick.bind(this));
            presenter.appendChild(svgIndicatorReady);
            this._pointerReady = { entry: null, top: 0, indicator: svgIndicatorReady };
            // Playing Pointer
            const svgIndicatorPlaying = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIndicatorPlaying.classList.add("pointer-syncentry", "entrynow");
            // svgIndicatorPlaying.innerHTML = `<path d="m 28.0005,13 c 0,-1.109 -0.891,-2 -2,-2 l -14,0 3.156,-2.359 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 l -8,6 c -0.5,0.375 -0.797,0.969 -0.797,1.594 v 11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.75,1.437 c 1,0.25 2.016,0.375 3.031,0.375 h 3.391 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 v -0.5 h 0.953 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 h -1 v -0.5 h 1.406 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 l -1.5,0 V 15 l 8.906,0 c 1.125,0 2.094,-0.859 2.094,-2 z m 2,0 c 0,2.234 -1.875,4 -4.094,4 h -3.437 c 0.016,0.172 0.031,0.328 0.031,0.5 0,1.016 -0.391,1.969 -1.078,2.703 0.219,0.484 0.328,1.016 0.328,1.547 0,1.125 -0.5,2.172 -1.359,2.875 0.078,0.297 0.109,0.578 0.109,0.875 0,1.969 -1.641,3.5 -3.578,3.5 h -3.391 c -1.172,0 -2.359,-0.141 -3.516,-0.438 l -5.75,-1.437 C 2.9375,26.797 1.9995,25.594 1.9995,24.219 V 13 c 0,-1.25 0.609,-2.453 1.594,-3.203 l 8,-6 C 12.2815,3.281 13.1405,3 13.9995,3 c 2.188,0 4,1.781 4,3.969 0,0.719 -0.187,1.422 -0.547,2.031 l 8.547,0 c 2.203,0 4,1.797 4,4 z m -22,2 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z" />`;
            svgIndicatorPlaying.innerHTML = `<g
			id="g4163">
		   <path
			  d="m 28.034398,13 c 0,-1.109 -0.891,-2 -2,-2 l -14.000001,0 3.156,-2.3589999 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 L 4.8313978,11.406 c -0.5,0.375 -0.797,0.969 -0.797,1.594 l 0,11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.7499992,1.437 c 1,0.25 2.016,0.375 3.031,0.375 l 3.391001,0 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 l 0,-0.5 0.953,0 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 l -1,0 0,-0.5 1.406,0 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 l -1.5,0 0,-0.5 8.906,0 c 1.125,0 2.094,-0.859 2.094,-2 z"
			  id="path4161"
			  style="fill:#ffffff" />
		   <path
			  d="m 28.0005,13 c 0,-1.109 -0.891,-2 -2,-2 l -14,0 3.156,-2.359 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 l -8,6 c -0.5,0.375 -0.797,0.969 -0.797,1.594 v 11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.75,1.437 c 1,0.25 2.016,0.375 3.031,0.375 h 3.391 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 v -0.5 h 0.953 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 h -1 v -0.5 h 1.406 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 l -1.5,0 V 15 l 8.906,0 c 1.125,0 2.094,-0.859 2.094,-2 z m 2,0 c 0,2.234 -1.875,4 -4.094,4 h -3.437 c 0.016,0.172 0.031,0.328 0.031,0.5 0,1.016 -0.391,1.969 -1.078,2.703 0.219,0.484 0.328,1.016 0.328,1.547 0,1.125 -0.5,2.172 -1.359,2.875 0.078,0.297 0.109,0.578 0.109,0.875 0,1.969 -1.641,3.5 -3.578,3.5 h -3.391 c -1.172,0 -2.359,-0.141 -3.516,-0.438 l -5.75,-1.437 C 2.9375,26.797 1.9995,25.594 1.9995,24.219 V 13 c 0,-1.25 0.609,-2.453 1.594,-3.203 l 8,-6 C 12.2815,3.281 13.1405,3 13.9995,3 c 2.188,0 4,1.781 4,3.969 0,0.719 -0.187,1.422 -0.547,2.031 l 8.547,0 c 2.203,0 4,1.797 4,4 z m -22,2 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z"
			  id="path4" />
		 </g>`;
            svgIndicatorPlaying.addEventListener("click", this._onContextSensorClick.bind(this));
            presenter.appendChild(svgIndicatorPlaying);
            this._pointerPlaying = { entry: null, top: 0, indicator: svgIndicatorPlaying };
            // Phantom Pointer
            const svgIndicatorPhantom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgIndicatorPhantom.classList.add("pointer-syncentry", "entryphantom");
            // svgIndicatorPhantom.innerHTML = `<path d="m 28.0005,13 c 0,-1.109 -0.891,-2 -2,-2 h -14 l 3.156,-2.359 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 l -8,6 c -0.5,0.375 -0.797,0.969 -0.797,1.594 v 11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.75,1.437 c 1,0.25 2.016,0.375 3.031,0.375 h 3.391 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 v -0.5 h 0.953 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 h -1 v -0.5 h 1.406 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 h -1.5 V 15 h 8.906 c 1.125,0 2.094,-0.859 2.094,-2 z m 2,0 c 0,2.234 -1.875,4 -4.094,4 h -3.437 c 0.016,0.172 0.031,0.328 0.031,0.5 0,1.016 -0.391,1.969 -1.078,2.703 0.219,0.484 0.328,1.016 0.328,1.547 0,1.125 -0.5,2.172 -1.359,2.875 0.078,0.297 0.109,0.578 0.109,0.875 0,1.969 -1.641,3.5 -3.578,3.5 h -3.391 c -1.172,0 -2.359,-0.141 -3.516,-0.438 l -5.75,-1.437 C 2.9375,26.797 1.9995,25.594 1.9995,24.219 V 13 c 0,-1.25 0.609,-2.453 1.594,-3.203 l 8,-6 C 12.2815,3.281 13.1405,3 13.9995,3 c 2.188,0 4,1.781 4,3.969 0,0.719 -0.187,1.422 -0.547,2.031 h 8.547 c 2.203,0 4,1.797 4,4 z" />`;
            svgIndicatorPhantom.innerHTML = `<g
			id="g4163">
		   <path
			  d="m 28.034398,13 c 0,-1.109 -0.891,-2 -2,-2 l -14.000001,0 3.156,-2.3589999 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 L 4.8313978,11.406 c -0.5,0.375 -0.797,0.969 -0.797,1.594 l 0,11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.7499992,1.437 c 1,0.25 2.016,0.375 3.031,0.375 l 3.391001,0 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 l 0,-0.5 0.953,0 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 l -1,0 0,-0.5 1.406,0 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 l -1.5,0 0,-0.5 8.906,0 c 1.125,0 2.094,-0.859 2.094,-2 z"
			  id="path4161"
			  style="fill:#ffffff" />
		   <path
			  d="m 28.0005,13 c 0,-1.109 -0.891,-2 -2,-2 l -14,0 3.156,-2.359 c 0.516,-0.391 0.844,-1.016 0.844,-1.672 0,-1.094 -0.922,-1.969 -2,-1.969 -0.438,0 -0.859,0.141 -1.203,0.406 l -8,6 c -0.5,0.375 -0.797,0.969 -0.797,1.594 v 11.219 c 0,0.453 0.313,0.859 0.75,0.969 l 5.75,1.437 c 1,0.25 2.016,0.375 3.031,0.375 h 3.391 c 0.828,0 1.578,-0.641 1.578,-1.5 0,-0.828 -0.672,-1.5 -1.5,-1.5 v -0.5 h 0.953 c 0.984,0 1.797,-0.75 1.797,-1.75 0,-0.969 -0.781,-1.75 -1.75,-1.75 h -1 v -0.5 h 1.406 c 1.125,0 2.094,-0.859 2.094,-2 0,-1.109 -0.891,-2 -2,-2 l -1.5,0 V 15 l 8.906,0 c 1.125,0 2.094,-0.859 2.094,-2 z m 2,0 c 0,2.234 -1.875,4 -4.094,4 h -3.437 c 0.016,0.172 0.031,0.328 0.031,0.5 0,1.016 -0.391,1.969 -1.078,2.703 0.219,0.484 0.328,1.016 0.328,1.547 0,1.125 -0.5,2.172 -1.359,2.875 0.078,0.297 0.109,0.578 0.109,0.875 0,1.969 -1.641,3.5 -3.578,3.5 h -3.391 c -1.172,0 -2.359,-0.141 -3.516,-0.438 l -5.75,-1.437 C 2.9375,26.797 1.9995,25.594 1.9995,24.219 V 13 c 0,-1.25 0.609,-2.453 1.594,-3.203 l 8,-6 C 12.2815,3.281 13.1405,3 13.9995,3 c 2.188,0 4,1.781 4,3.969 0,0.719 -0.187,1.422 -0.547,2.031 l 8.547,0 c 2.203,0 4,1.797 4,4 z m -22,2 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z m 0,4 h 6 v -0.5 h -6 z"
			  id="path4" />
		 </g>`;
            svgIndicatorPhantom.addEventListener("click", this._onContextSensorClick.bind(this));
            presenter.appendChild(svgIndicatorPhantom);
            this._pointerPhantom = { entry: null, top: 0, indicator: svgIndicatorPhantom };
            //
            //
            //
            const listCtx = presenter.querySelectorAll(".sync-context");
            for (let i = 0; i < listCtx.length; i++) {
                const ctx = new SyncContext(this, listCtx[i]);
                ctx.sensor.addEventListener("click", this._onContextSensorClick.bind(this));
                this._contexts.push(ctx);
            }
            //
            // После того как подготовили синхрообвязку текста, подготавливаем медиаэлементы
            //
            this._medias = [];
            const listPlayer = presenter.querySelectorAll("video,audio");
            for (let i = 0; i < listPlayer.length; i++) {
                const player = new SyncMedia(this, listPlayer[i]);
                player.eventMediaStateChanged.subscribe(this._onMediaStateChanged.bind(this));
                this._medias.push(player);
            }
            //
            // Теперь ассоциируем медиаэлементы с соотв. диапазонами
            //
            this._medias.forEach((player, index) => {
                this._contexts.forEach((ctx) => {
                    ctx.entries.forEach((entry) => {
                        player.regRange(entry.getRange(index));
                    });
                    player.completeReg();
                });
            });
            //
            // Первый медиаисточник объявляем активным
            //
            if (this._medias.length > 0) {
                this._setActiveMedia(0);
            }
        }
        // Infrastructure
        // -------------------------------------------------------------------
        indicateAttention(entry) {
            this._checkPlayingContext(entry);
            //
            if (!this._pointerPlaying.entry) {
                this._hidePointer(this._pointerPhantom);
                //
                const nIndicatorTop = this._calcIndicatorTop(entry);
                if (nIndicatorTop !== SyncArea.UNDEFOFFSET) {
                    this._pointerReady.entry = entry;
                    this._pointerReady.top = nIndicatorTop;
                    this._showPointer(this._pointerReady);
                }
            }
        }
        indicatePlaying(entry) {
            this._checkPlayingContext(entry);
            //
            this._hidePointer(this._pointerReady);
            this._hidePointer(this._pointerPhantom);
            //
            // если проигрывание не идёт, то просто ничего не отображаем
            if (this._mediaActive && this._mediaActive.isPlaying) {
                // на статус entry - не обращаем внимания!
                const nIndicatorTop = this._calcIndicatorTop(entry);
                if (nIndicatorTop !== SyncArea.UNDEFOFFSET) {
                    this._pointerPlaying.entry = entry;
                    this._pointerPlaying.top = nIndicatorTop;
                    this._showPointer(this._pointerPlaying);
                }
            }
            else {
                this._hidePointer(this._pointerPlaying);
            }
        }
        hideEntryPlaying() {
            if (this._pointerPlaying.entry) {
                // переводим в Phantom
                this._pointerPhantom.entry = this._pointerPlaying.entry;
                this._pointerPhantom.top = this._pointerPlaying.top;
                this._showPointer(this._pointerPhantom);
                this._hidePointer(this._pointerPlaying);
            }
        }
        hideIndicationAll() {
            this._hidePointer(this._pointerReady);
            this._hidePointer(this._pointerPlaying);
            this._hidePointer(this._pointerPhantom);
        }
        get players() {
            return this._medias;
        }
        //
        selectMe(entry) {
            if (this._mediaActive) {
                const nMediaIndex = this._medias.indexOf(this._mediaActive);
                if (nMediaIndex >= 0) {
                    this._mediaActive.selectRange(entry.getRange(nMediaIndex));
                }
            }
        }
        // Public Events
        // -------------------------------------------------------------------
        // Internal Members
        // -------------------------------------------------------------------
        _setActiveMedia(_nActiveMediaIndex) {
            if (this._nActiveMediaIndex === _nActiveMediaIndex) {
                return;
            }
            if (this._mediaActive) {
                this._mediaActive.setActiveStatus(false);
            }
            this._nActiveMediaIndex = _nActiveMediaIndex;
            this._mediaActive = this._medias[_nActiveMediaIndex];
            if (this._mediaActive) {
                this._mediaActive.setActiveStatus(true);
            }
        }
        _calcIndicatorTop(entry) {
            /* // Вариант с JQuery
            let coordEntry: JQuery.Coordinates | undefined = (entry.mark) ? $(entry.mark.presenter).offset() : undefined;
            let coordScope: JQuery.Coordinates | undefined = $(this._presenter).offset();
            return (coordEntry && coordScope) ? coordEntry.top - coordScope.top : SyncScope.UNDEFOFFSET;
            */
            // я сделал свой (может чуть побыстрее работает?)
            // здесь предполагаем, что entry ассоциирован с mark
            return SyncUtils.getVertOffset(entry.mark.presenter, this._presenter);
        }
        _showPointer(pointer) {
            if (this._hteScrollOwner && pointer.entry && pointer.entry.mark) {
                const hteEntryPresenter = pointer.entry.mark.presenter;
                if (hteEntryPresenter.offsetHeight > 0) { // иначе Entry скрыт (т.е. не имеет высоты) 
                    pointer.indicator.style.top = pointer.top.toString() + "px";
                    pointer.indicator.style.visibility = "visible";
                    //
                    if (this._bAutoScroll && this._mediaActive && this._mediaActive.isPlaying) {
                        setTimeout(() => {
                            this._ensureVisible(pointer);
                        }, 0);
                    }
                }
            }
        }
        _ensureVisible(pointer) {
            if (this._bAnimating) {
                return;
            }
            //
            if (pointer.entry && this._hteScrollOwner) {
                const hteEntryPresenter = pointer.entry.mark.presenter;
                if (hteEntryPresenter.offsetHeight > 0) {
                    let nEntryOffset = SyncUtils.getVertOffset(hteEntryPresenter, this._hteScrollOwner);
                    const nScrollTop = this._hteScrollOwner.scrollTop;
                    const nViewThresholdLower = this._hteScrollOwner.clientHeight - (hteEntryPresenter.offsetHeight * 1.5);
                    const nViewThresholdUpper = this._hteScrollOwner.clientHeight / 2;
                    if (nEntryOffset < 0) {
                        let nScrollTopNew = (nScrollTop + nEntryOffset) - SyncUtils.sepfactor; // 07-Oct-2019
                        if (nScrollTopNew < 0) {
                            nScrollTopNew = 0;
                        }
                        this._bAnimating = true;
                        this._$hteScrollOwner.animate({ scrollTop: nScrollTopNew }, 500, () => {
                            this._bAnimating = false;
                            this._$hteScrollOwner.finish();
                        });
                    }
                    else {
                        const nEntryOffsetBottom = (nEntryOffset + hteEntryPresenter.offsetHeight);
                        if (nEntryOffsetBottom > nViewThresholdLower) {
                            // надо скроллировать вверх (т.е. вниз)
                            this._bAnimating = true;
                            let nScrollTopDesired = nScrollTop + (nEntryOffset - nViewThresholdUpper);
                            this._$hteScrollOwner.animate({ scrollTop: nScrollTopDesired }, 500, () => {
                                this._bAnimating = false;
                                this._$hteScrollOwner.finish();
                            });
                        }
                    }
                } // if (hteEntryPresenter.offsetHeight > 0)
            } // if (pointer.entry && this._hteScrollOwner)
        }
        _hidePointer(pointer) {
            pointer.indicator.style.visibility = "hidden";
            pointer.entry = null;
            pointer.top = -100; // чтоб больше высоты индикатора
        }
        _setPlayingContext(ctx) {
            if (this._ctxPlaying) {
                this._ctxPlaying.setActive(false);
            }
            //
            this._ctxPlaying = ctx;
            if (this._ctxPlaying) {
                this._ctxPlaying.setActive(true);
            }
        }
        _checkPlayingContext(entry) {
            if (this._mediaActive && this._mediaActive.isPlaying && this._ctxPlaying !== entry.context) {
                this._setPlayingContext(entry.context);
            }
        }
        // Event Handlers
        // -------------------------------------------------------------------
        /* Grigory! Новая модель жестов - изменить на одинар нажатие/стоп/пуск*/
        _onContextSensorClick(ev) {
            if (this._mediaActive) {
                //
                // Запустить/Остановить проигрывание
                //
                if (this._mediaActive.isPlaying) {
                    this._mediaActive.pause();
                }
                else {
                    this._mediaActive.play();
                }
            }
        }
        _onMediaStateChanged(sender, stateNew) {
            switch (stateNew) {
                case SyncMediaStates.Paused: {
                    if (this._ctxPlaying) {
                        this._setPlayingContext(null);
                    }
                    //
                    if (sender === this._mediaActive) {
                        this.hideIndicationAll();
                    }
                    //
                    break;
                }
            }
        }
    } // class SyncArea
    SyncArea.UNDEFOFFSET = -1000;
    MediaSyncMachine.SyncArea = SyncArea;
})(MediaSyncMachine || (MediaSyncMachine = {})); // namespace MediaSync
var VSect;
(function (VSect) {
    class PageBrick {
        constructor(presenter, owner) {
            this._presenter = presenter;
            this._$presenter = $(this._presenter);
            //
            this._pageOwner = owner;
            //
            this._onInitialize();
        }
        _onInitialize() {
            //
        }
    }
    VSect.PageBrick = PageBrick;
    class PromptOnce extends PageBrick {
        //
        constructor(presenter, owner) {
            super(presenter, owner);
            this._bOpened = false;
            //
            this._$PromptOnce = $(presenter);
            let mode = this._$PromptOnce.data("mode");
            if (mode && mode === "static") {
                this._bOpened = true;
                this._$PromptOnce.find("#close").on("click", () => {
                    this._close();
                });
            }
            else {
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
        get isOpened() {
            return this._bOpened;
        }
        //
        //
        _close() {
            this._$PromptOnce.remove();
            this._bOpened = false;
        }
    }
    VSect.PromptOnce = PromptOnce;
    // HorzSolidArea ?
    class HorizontalArea extends PageBrick {
        /* Construction / Initialization / Desctruction
        ----------------------------------------------------------*/
        constructor(presenter, owner) {
            super(presenter, owner);
            //
            this._isBusy = false;
            this._isIndicatorDisplaying = false;
            this._bDone = false;
            //
            this._$content = this._$presenter.find(".content");
            this._$indicator = this._$presenter.find(".indicator");
            this._$scrolledArea = $(owner.body);
            //
            this._$indicator.hide();
            //
            if (this._$content.length === 1 && this._$indicator.length === 1) {
                this._pageOwner.eventStateChanged.subscribe(this._onOwnerStateChanged.bind(this));
                this._pageOwner.eventScroll.subscribe(this._onOwnerScroll.bind(this));
                window.onresize = (ev) => {
                    this._check();
                };
                //
                this._$presenter.on("scroll", (ev) => { if (this._isIndicatorDisplaying) {
                    this._hideIndicator();
                } });
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
        _check() {
            if (!this._isBusy) {
                this._isBusy = true;
                //
                if (this._checkInViewport(this._$content)) {
                    // А теперь вопрос - нужен ли вообще индикатор?
                    const nElemHorzScrollWidth = this._$presenter.width();
                    const nScrollContentWidth = this._$content.width();
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
        _checkInViewport($elem) {
            let bSatisfy = false;
            //
            const nViewportTop = (this._$scrolledArea).scrollTop();
            const nViewportHeight = (this._$scrolledArea).height();
            if (nViewportTop !== undefined && nViewportHeight !== undefined) {
                const nViewportBottom = nViewportTop + nViewportHeight;
                //
                const nElemTop = $elem.offset().top;
                const nElemHeight = $elem.outerHeight();
                const nElemBottom = nElemTop + nElemHeight;
                //
                const nElemLedge = nElemBottom - nViewportBottom;
                bSatisfy = (nElemLedge < (nElemHeight / 2));
            }
            //
            return bSatisfy;
        }
        _displayIndicator() {
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
        _hideIndicator() {
            if (this._isIndicatorDisplaying) {
                // console.log("закрытие индикатора");
                this._isIndicatorDisplaying = false;
                this._$indicator.hide(1000);
            }
        }
        /* Event Handlers
        ----------------------------------------------------------*/
        _onOwnerStateChanged(sender, args) {
            if (args === VSect.PageDisplayingStates.Outside) {
                this._bDone = false;
            }
        }
        _onOwnerScroll(sender, args) {
            this._check();
        }
    } // class HorizontalArea
    VSect.HorizontalArea = HorizontalArea;
})(VSect || (VSect = {})); // namespace VSect
/// <reference path="./media/m-synclib.ts"/>
/// <reference path="./utils.ts"/>
//
var VSect;
/// <reference path="./media/m-synclib.ts"/>
/// <reference path="./utils.ts"/>
//
(function (VSect) {
    "use strict";
    class PageViewState {
        constructor() {
            /* Class Variables and Constants
            ----------------------------------------------------------*/
            this._bDefined = false;
            this._nScrollTop = 0;
            this._nScrollLeft = 0;
        }
        /* Public Members
        ----------------------------------------------------------*/
        get isDefined() {
            return this._bDefined;
        }
        get nScrollTop() {
            return this._nScrollTop;
        }
        set nScrollTop(val) {
            this._nScrollTop = val;
            this._bDefined = true;
        }
        get nScrollLeft() {
            return this._nScrollLeft;
        }
        set nScrollLeft(val) {
            this._nScrollLeft = val;
            this._bDefined = true;
        }
        reset() {
            this._nScrollTop = 0;
            this._nScrollLeft = 0;
            this._bDefined = false;
        }
    } // class PageViewState
    // =====================================================================
    class AppPage {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(uri, life = VSect.PageLifeModes.Discard) {
            this._oViewState = new PageViewState();
            //
            this._bricks = [];
            this._doRestoreState = undefined;
            this._onProcessed = undefined;
            this._presenter = null;
            this._body = null;
            this._bProcessed = false;
            //
            this._uri = uri;
            this._eLifeMode = life;
            //
            this._stateDisplaying = VSect.PageDisplayingStates.Outside;
            this._eventStateChanged = new VSect.EventNest(this);
            this._eventScroll = new VSect.EventNest(this);
        }
        // Infrastructure
        // -------------------------------------------------------------------
        get isProcessed() {
            return this._bProcessed;
        }
        processContent() {
            return new Promise((handComplete, handError) => {
                // проверяем наличие prompt-once
                // возможно такие процедуры надо выносить в отдельные ф. (пока здесь)
                const thePresenter = this._presenter;
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
                $(".card.folder", thePresenter).on("shown.bs.collapse", (ev) => {
                    $(ev.currentTarget).addClass("opened");
                });
                $(".card.folder", thePresenter).on("hidden.bs.collapse", (ev) => {
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
        markError(error) {
            this._errorCase = error;
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
        }
        // INavPage Implementation
        // -------------------------------------------------------------------
        get presenter() {
            return this._presenter;
        }
        get hasPresenter() {
            return !!this._presenter;
        }
        get body() {
            return this._body;
        }
        get uri() {
            return this._uri;
        }
        get tag() {
            return this._tag;
        }
        set tag(value) {
            this._tag = value;
        }
        requestNavigation() {
            let _this = this;
            return new Promise((completeReadyHandler, errorReadyHandler) => {
                if (_this._presenter) {
                    // пока просто жёстко
                    completeReadyHandler(_this);
                }
                else {
                    let presenter = createPresenter();
                    //
                    $(presenter).load(_this._uri, (response, status, xhr) => {
                        if (status === "error") {
                            let msg = "Error loading App Templates: " + xhr.status + " " + xhr.statusText;
                            _this.markError(new VSect.ErrorCase(msg));
                            _this._setPresenter(presenter);
                            errorReadyHandler(_this);
                        }
                        else {
                            _this._setPresenter(presenter);
                            completeReadyHandler(_this);
                        }
                    });
                }
            });
            // inline Function
            function createPresenter() {
                let element = document.createElement("div");
                element.classList.add("page-presenter");
                return element;
            }
        }
        notifyAttached() {
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
        notifyActive() {
            // в этой реализации, кажется никогда не вызывается!
            // this._changeState(VSect.PageDisplayingStates.Active);
        }
        notifyPassive() {
            this._changeState(VSect.PageDisplayingStates.Passive);
        }
        notifyRejection() {
            this._changeState(VSect.PageDisplayingStates.Outside);
            //
            if (this._eLifeMode === VSect.PageLifeModes.Discard) { // код не завершённый - нужна более сложная проверка на персист.
                this._releasePresenter();
            }
            else {
                //
            }
        }
        notifyDetached() {
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
        get hasError() {
            return (!!this._errorCase);
        }
        get error() {
            return (this._errorCase) ? this._errorCase : null;
        }
        get life() {
            return this._eLifeMode;
        }
        get state() {
            return this._stateDisplaying;
        }
        get eventStateChanged() {
            return this._eventStateChanged;
        }
        get eventScroll() {
            return this._eventScroll;
        }
        updateLayout() {
            //
        }
        // Public Members
        // -------------------------------------------------------------------
        forceLifeMode(mode) {
            this._eLifeMode = mode;
        }
        // Virtuals
        // -------------------------------------------------------------------
        // protected _onPresenterCreated?: (vePresenter: HTMLElement) => void = undefined;
        _onPresenterCreated(vePresenter) {
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
        }
        // Internal Members
        // -------------------------------------------------------------------
        _setPresenter(htePresenter) {
            this._presenter = htePresenter;
            this._body = htePresenter.querySelector(".page-body");
            if (this._body) {
                this._body.addEventListener("scroll", (ev) => {
                    this._eventScroll.raise(ev);
                });
            }
            //
            htePresenter.dataset.origClasses = htePresenter.className;
            //
            if (this._errorCase) {
                this._applyErrorState(this._errorCase);
            }
            else {
                this._onPresenterCreated(this._presenter);
            }
        }
        _releasePresenter() {
            this._presenter = null;
            this._bProcessed = false;
        }
        _applyErrorState(error) {
            if (this.hasPresenter) {
                const presenter = this._presenter;
                presenter.innerHTML = "";
                presenter.classList.add("app-error");
                presenter.appendChild(error.getErrorDisplay());
            }
        }
        _processBricks(hteScope) {
            let bricks = hteScope.querySelectorAll(".bk-brick");
            for (let i = 0; i < bricks.length; i++) {
                let brickpresenter = bricks[i];
                let typename = brickpresenter.dataset.type;
                switch (typename) {
                    case "PromptOnce": {
                        this._bricks.push(new VSect.PromptOnce(brickpresenter, this));
                        break;
                    }
                    case "HorizontalArea": {
                        this._bricks.push(new VSect.HorizontalArea(brickpresenter, this));
                        break;
                    }
                }
            }
        }
        _raiseProcessed() {
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
        _changeState(stateNew) {
            const stateOld = this._stateDisplaying;
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
    VSect.AppPage = AppPage;
    // =====================================================================
    class MasterPage extends AppPage {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(uri) {
            super(uri, VSect.PageLifeModes.Held);
        }
        // Public Members
        // -------------------------------------------------------------------
        get title() {
            if (this._presenter) {
                let hteTitle = this._presenter.querySelector("title");
                if (hteTitle) {
                    return hteTitle.innerText;
                }
                else {
                    return "";
                }
            }
            else {
                return "";
            }
        }
        // Overrides
        // -------------------------------------------------------------------
        _onPresenterCreated(htePresenter) {
            super._onPresenterCreated(htePresenter);
            //
            if (!this.hasError) {
                this._$linkDetailPages = $(".master-content *[data-uri]", htePresenter);
                this._$linkDetailPages.on("click", this._onLinkClick);
                //
                this._$btnToggleScreen = $(".master-content header #btnScreenToggle", htePresenter);
                this._$btnToggleScreen.on("click", this._toggleFullScreen);
                document.documentElement.addEventListener("fullscreentoggled", this._onFullScreenToggled.bind(this), false);
                document.documentElement.addEventListener("fullscreenfailed", this._onFullScreenError.bind(this), false);
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
        _toggleFullScreen() {
            if (VSect.FullScreenToggler.getFullScreenElement()) {
                VSect.FullScreenToggler.cancelFullScreen();
            }
            else {
                VSect.FullScreenToggler.launchFullScreen(document.documentElement);
            }
        }
        // Event Handlers
        // -------------------------------------------------------------------
        // Получается здесь Event а не JQuery.Event
        // private _onLinkClick(ev: JQuery.Event): void {
        _onLinkClick(ev) {
            let hteAnchor = ev.currentTarget;
            let strPath = hteAnchor.dataset.uri;
            if (strPath) {
                VSect.MainView.toPage(strPath, hteAnchor);
            }
        }
        _onFullScreenToggled(ev) {
            if (this._$btnToggleScreen) {
                if (VSect.FullScreenToggler.getFullScreenElement()) {
                    this._$btnToggleScreen.addClass("restorescreen");
                }
                else {
                    this._$btnToggleScreen.removeClass("restorescreen");
                }
            }
        }
        _onFullScreenError(ev) {
            // BookRT.Diagnostics.logError(new WinJS.ErrorFromName("FullScreenError", "full screen error has occurred " + ev.target));
        }
    } // class MasterPage
    VSect.MasterPage = MasterPage;
    // =====================================================================
    class DetailPage extends AppPage {
        // Construction / Initialization
        // -------------------------------------------------------------------
        constructor(master, uri, life = VSect.PageLifeModes.Persistent) {
            super(uri, life);
            // super(uri, PageLifeModes.Held);
            //
            this._master = master;
            this._syncmach = new MediaSyncMachine.SyncManager(this);
        }
        // Overrides
        // -------------------------------------------------------------------
        _onPresenterCreated(htePresenter) {
            super._onPresenterCreated(htePresenter);
            //
            if (!this.hasError) {
                $(".goback", htePresenter).click((ev) => {
                    VSect.MainView.toMasterPage();
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
                const $player = $("audio", htePresenter);
                if ($player.length > 0) {
                    $player.audioPlayer();
                }
                //
                // возможно надо передавать AppPage!!!
                this._syncmach.process();
                //
            }
        }
    } // class DetailPage
    VSect.DetailPage = DetailPage;
})(VSect || (VSect = {})); // namespace MasterDetail
var VSect;
(function (VSect) {
    "use strict";
    //
    // Эта модель устарела (Grigiry. 14-Jan-2020)
    //
    class ActivityArea {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor() {
            //
        }
    } // class ActivityArea
    VSect.ActivityArea = ActivityArea;
    class TaskAct {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor() {
            //
        }
    } // class TaskItem
    VSect.TaskAct = TaskAct;
    class TaskItem {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor() {
            //
        }
    } // class TaskItem
    VSect.TaskItem = TaskItem;
    class TestItem {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor() {
            //
        }
    } // class TaskItem
    VSect.TestItem = TestItem;
})(VSect || (VSect = {})); // namespace MasterDetail
var VSect;
(function (VSect) {
    "use strict";
    class ActivityProcessor {
        // Class Variables and Constants
        // -------------------------------------------------------------------
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor() {
            //
        }
    } // class ActivityProcessor
    VSect.ActivityProcessor = ActivityProcessor;
})(VSect || (VSect = {})); // namespace MasterDetail
///<reference path="./m-synclib.ts" />
///<reference path="./../page.ts" />
var MediaSyncMachine;
///<reference path="./m-synclib.ts" />
///<reference path="./../page.ts" />
(function (MediaSyncMachine) {
    "use strict";
    class SyncManager {
        // Construction / Initialization / Destruction
        // -------------------------------------------------------------------
        constructor(page) {
            this._bSyncTextPauseShowing = false;
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
        process() {
            let htePagePresenter = this._pageOwner.presenter;
            //
            let htePageBody = this._pageOwner.body;
            htePageBody.appendChild(this._btnSyncTextPause[0]);
            //
            // Структура SyncMachine подготавливается асинхронно для внешнего вызова, но внутри процесс синхронный
            setTimeout(() => {
                const areas = htePagePresenter.querySelectorAll(".sync-area");
                for (let i = 0; i < areas.length; i++) {
                    const area = new MediaSyncMachine.SyncArea(areas[i], htePagePresenter.querySelector(".page-body"));
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
        get isReady() {
            return this._bReady;
        }
        // Public Events
        // -------------------------------------------------------------------
        // Internal Members
        // -------------------------------------------------------------------
        _positionSyncTextPauseButton() {
            let htePageBody = this._pageOwner.body;
            //
            let nButtonWidth = this._btnSyncTextPause.outerWidth(true);
            let nOffsetTop = htePageBody.offsetTop;
            let nOffsetLeft = nButtonWidth ? ((htePageBody.offsetLeft + htePageBody.clientWidth) - nButtonWidth) : 0;
            this._btnSyncTextPause.css("top", nOffsetTop + "px");
            this._btnSyncTextPause.css("left", nOffsetLeft + "px");
        }
        _showSyncTextPauseButton() {
            if (!this._bSyncTextPauseShowing) {
                this._positionSyncTextPauseButton();
                //
                this._bSyncTextPauseShowing = true;
                this._btnSyncTextPause.show("slow");
            }
        }
        _hideSyncTextPauseButton() {
            if (this._bSyncTextPauseShowing) {
                this._bSyncTextPauseShowing = false;
                this._btnSyncTextPause.hide("slow");
            }
        }
        // Event Handlers
        // -------------------------------------------------------------------
        _onMediaStateChanged(sender, stateNew) {
            switch (stateNew) {
                case MediaSyncMachine.SyncMediaStates.Playing: {
                    if (this._mediaPlaying && this._mediaPlaying !== sender) {
                        this._mediaPlaying.pause();
                    }
                    //
                    this._mediaPlaying = sender;
                    this._showSyncTextPauseButton();
                    break;
                }
                case MediaSyncMachine.SyncMediaStates.Paused: {
                    if (sender === this._mediaPlaying) {
                        this._hideSyncTextPauseButton();
                    }
                    break;
                }
            }
        }
        _onSyncTextPauseClicked(ev) {
            if (this._mediaPlaying && this._mediaPlaying.isPlaying) {
                this._mediaPlaying.pause();
            }
        }
    } // class SyncManager
    MediaSyncMachine.SyncManager = SyncManager;
})(MediaSyncMachine || (MediaSyncMachine = {})); // namespace MediaSync
//# sourceMappingURL=master-detail.js.map