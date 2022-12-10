///<reference path="./../events.ts" />
///<reference path="./../common.ts" />

namespace MediaSyncMachine {
	"use strict";

	export type SyncUnit = number; // в секундах

	export abstract class SyncUtils {
		public static toSyncUnits(strValue: string): number {
			let nResult: number = 0;
			//
			let a: string[] = strValue.split(":");
			if (a.length > 1) {
				// не отлажено!!!
				for (let i: number = 0; i < a.length; i++) {
					let strVal: string = a[a.length - (i + 1)];
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
			} else {
				nResult = parseFloat(strValue);
			}
			//
			return nResult;
		}

		public static getVertOffset(elem: HTMLElement, elemTarget: HTMLElement): number {
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

		private static _nSepFactor: number = -1;
		public static get sepfactor(): number {
			if (this._nSepFactor < 0) {
				const strFontSize: string | null = getComputedStyle(<Element>document.documentElement).fontSize;
				this._nSepFactor = strFontSize ? parseFloat(strFontSize) : 16;
			}
			//
			return this._nSepFactor;
		}
	} // class SyncUtils 



	export class MediaActor {
		private _strName: string;
		private _bDefault: boolean = false;

		// с именем идентификатором и т.п. - пока не ясно...

		constructor(strName: string | undefined) {
			if (strName) {
				this._strName = strName;
			} else {
				this._strName = "Actor";
				this._bDefault = true;
			}
		}

		public get isDefault(): boolean {
			return this._bDefault;
		}

	} // class MediaActor


	/** Пока практически не используется. Возможно в перпективе будет иметь смысл разделять текст и объекты. */
	export enum SyncMarkKinds {
		Text,
		Object
	}

	export class SyncMark {
		private _hteMark: HTMLElement;
		private _kind: SyncMarkKinds = SyncMarkKinds.Text;
		private _entry?: SyncEntry;
		private _bSelected: boolean;
		private _bHighlighted: boolean;

		constructor(hteMark: HTMLElement) {
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
			hteMark.onclick = (ev: Event) => {
				// if (this._entry && (this._bSelected || this._bHighlighted)) {
				// 	this._entry.context.area.selectMe(this._entry);
				// }

				if (this._entry) {
					this._entry.context.area.selectMe(this._entry);
				}


			};


		}

		//

		public assoc(entry: SyncEntry): void {
			this._entry = entry;
		}

		public get hasAssoc(): boolean {
			return !!(this._entry);
		}

		//

		public get selected(): boolean {
			return this._bSelected;
		}
		public set selected(value: boolean) {
			this._bSelected = value;
			if (this._bSelected) {
				this._hteMark.classList.add("selected");
			} else {
				this._hteMark.classList.remove("selected");
			}
		}

		public highlightOn(): void {
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

		public highlightOff(): void {
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

		public get isHighlighted(): boolean {
			return this._bHighlighted;
		}

		//

		public get presenter(): HTMLElement {
			return this._hteMark;
		}

	} // class SyncMark


	export class SyncRange {
		private _entry: SyncEntry;

		private _nStartIn: SyncUnit = -1; // если -1, то считается нет значения.
		private _nEndIn: SyncUnit = -1;
		private _nStartOut: SyncUnit = -1;
		private _nEndOut: SyncUnit = -1;

		private _bOutSpreaded: boolean = false;
		private _nStartInSaved = -1;
		private _nEndInSaved = -1;

		private _actor: MediaActor;

		constructor(entry: SyncEntry, data: HTMLElement | JSON) {
			this._entry = entry;
			//
			if (data instanceof HTMLElement) {
				const hteData: HTMLElement = <HTMLElement>data;
				//
				this._actor = new MediaActor(hteData.dataset.actor);
				if (hteData.dataset.src) {
					// Это диктор (только выход) значит только out.
					if (hteData.dataset.out) {
						let aValues: string[] = (hteData.dataset.out as string).split(";");
						if (aValues.length === 2) {
							this._nStartOut = SyncUtils.toSyncUnits(aValues[0]);
							this._nEndOut = SyncUtils.toSyncUnits(aValues[1]);
						} // else - неправильный формат!!!
					}
				} else {
					if (hteData.dataset.in) {
						// в этом случае "in" должен быть обязательно
						let aIn: string[] = (hteData.dataset.in as string).split(";");
						if (aIn.length === 2) {
							this._nStartIn = SyncUtils.toSyncUnits(aIn[0]);
							this._nEndIn = SyncUtils.toSyncUnits(aIn[1]);
							//
							if (hteData.dataset.out) {
								let aOut: string[] = (hteData.dataset.out as string).split(";");
								if (aOut.length === 2) {
									this._nStartOut = SyncUtils.toSyncUnits(aOut[0]);
									this._nEndOut = SyncUtils.toSyncUnits(aOut[1]);
								}
							} else {
								// тоже что и "in"
								this._nStartOut = this._nStartIn;
								this._nEndOut = this._nEndIn;
							}
						} // else - неправильный формат!!!
					}
				}

			} else {
				// JSon формат пока не поддерживается (вероятно потом)
				this._actor = new MediaActor(undefined);
			}
		}

		public get entry(): SyncEntry {
			return this._entry;
		}

		/** Включается в диапазон! */
		public get startIn(): number {
			// return this._nStartIn;
			return (this._nStartIn - this._entry.context.factorIn);
		}

		/** Не включается в диапазон! */
		public get endIn(): number {
			// по идее менять _nEndIn с учётом фактора надо в завис от FactorInStrategy:
			// ShiftRange или ShiftStart (пока пробуем ShiftStart поэтому _nEndIn не меняем)
			return this._nEndIn;
		}

		public get startOut(): number {
			return this._nStartOut;
		}

		public get endOut(): number {
			return this._nEndOut;
		}

		public get isValid(): boolean {
			return (this._nStartIn >= 0 && this._nEndIn > this._nStartIn);
		}

		public contains(pos: SyncUnit): boolean {
			// return (pos >= this._nStartIn && pos < this._nEndIn);
			return (pos >= this.startIn && pos < this.endIn);
		}


		public spreadOut(): void {
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

		public restoreIn(): void {
			if (this._bOutSpreaded) {
				this._bOutSpreaded = false;
				this._nStartIn = this._nStartInSaved;
				this._nEndIn = this._nEndInSaved;
			}
		}

		// Возможно эта ф. не будет исполь. т.к. фактор уже используется в _nStartIn _nEndIn
		// public applyFactorIn(suTime: SyncUnit): SyncUnit {
		// 	return suTime + this._entry.context.factorIn;
		// }

		/* Под вопросом!?
		public applyStartFactorOut(suTime: SyncUnit): SyncUnit {
			return suTime - this._entry.context.factorOut;
		}
		public applyEndFactorOut(suTime: SyncUnit): SyncUnit {
			return suTime + this._entry.context.factorOut;
		}
		*/

	} // class SyncRange


	export enum SyncEntryStatuses {
		None,
		Ready,
		Playing
	}

	export class SyncEntry {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _context: SyncContext;
		private _aStreamRanges: SyncRange[];
		private _aSpeakerRanges: SyncRange[];
		//
		private _mark?: SyncMark;

		private _bSelected: boolean;

		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(context: SyncContext, data: HTMLElement | JSON) {
			this._context = context;
			this._aStreamRanges = [];
			this._aSpeakerRanges = [];

			if (data instanceof HTMLElement) {
				const hteData: HTMLElement = <HTMLElement>data;
				const ranges: NodeListOf<HTMLElement> = hteData.querySelectorAll(".range");
				//
				// сначала диапазоны синх. с медиаисточниками
				ranges.forEach((hteRange: HTMLElement) => {
					if (!hteRange.dataset.src) {
						this._aStreamRanges.push(new SyncRange(this, hteRange));
					}
				});
				// теперь диапазоны с дикторами
				ranges.forEach((hteRange: HTMLElement) => {
					if (hteRange.dataset.src) {
						this._aSpeakerRanges.push(new SyncRange(this, hteRange));
					}
				});
			} else {
				// JSon формат пока не поддерживается (вероятно потом)
			}
			//
			this._bSelected = false;
		}


		// Infrastructure
		// -------------------------------------------------------------------
		public assoc(mark: SyncMark): void {
			this._mark = mark;
		}

		public get hasAssoc(): boolean {
			return !!(this._mark);
		}

		public getAssocPresenter(): HTMLElement | undefined {
			return (this._mark) ? this._mark.presenter : undefined;
		}

		// Public Members
		// -------------------------------------------------------------------
		public get context(): SyncContext {
			return this._context;
		}

		public get mark(): SyncMark | null {
			return (this._mark) ? this._mark : null;
		}

		public getRange(nStreamIndex: number): SyncRange | null {
			let range: SyncRange | null = null;
			//
			if (nStreamIndex >= 0 && nStreamIndex < this._aStreamRanges.length) {
				range = this._aStreamRanges[nStreamIndex];
			}
			//
			return range;
		}

		public get isSelected(): boolean {
			return this._bSelected;
		}

		public select(bSelected: boolean = true): void {
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
			} else {
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

		// Public Events
		// -------------------------------------------------------------------



		// Internal Members
		// -------------------------------------------------------------------



		// Event Handlers
		// -------------------------------------------------------------------



		// Entry Status
		// -------------------------------------------------------------------
		private _status: SyncEntryStatuses = SyncEntryStatuses.None;

		public get status(): SyncEntryStatuses {
			return this._status;
		}

		public changeStatus(status: SyncEntryStatuses): void {
			if (this._status === status) { return; }
			//
			const statusOld: SyncEntryStatuses = this._status;
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



	export class SyncContext {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _area: SyncArea;
		private _presenter: HTMLElement;
		private _marks: SyncMark[];
		private _entries: SyncEntry[];

		private _hteSensor: HTMLElement;
		private _bActive: boolean;

		private _nFactorIn: number;
		private _nFactorOut: number;

		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(area: SyncArea, presenter: HTMLElement) {
			this._area = area;
			this._presenter = presenter;
			this._marks = [];
			this._entries = [];
			//
			this._nFactorIn = (presenter.dataset.factorIn) ? parseFloat(presenter.dataset.factorIn as string) : 0;
			this._nFactorOut = (presenter.dataset.factorOut) ? parseFloat(presenter.dataset.factorOut as string) : 0;
			//
			let hteSyncText: HTMLElement | null = presenter.querySelector(".sync-text");
			if (hteSyncText) {
				const listMarks: NodeListOf<HTMLElement> = hteSyncText.querySelectorAll("mark");
				const listEntries: NodeListOf<HTMLElement> = presenter.querySelectorAll(".sync-info>.sync-entry");

				const nAssocMarkCount: number = Math.min(listMarks.length, listEntries.length);
				for (let i = 0; i < nAssocMarkCount; i++) {
					const mark: SyncMark = new SyncMark(listMarks[i]);
					this._marks.push(mark);

					const entry: SyncEntry = new SyncEntry(this, listEntries[i]);
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
			const divIndicator: HTMLElement = document.createElement("div");
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
		public get entries(): SyncEntry[] {
			return this._entries;
		}

		public get sensor(): HTMLElement {
			return this._hteSensor;
		}

		public get isActive(): boolean {
			return this._bActive;
		}

		public setActive(bIsActive: boolean): void {
			this._bActive = bIsActive;
			if (this._bActive) {
				this._hteSensor.classList.add("active");
			} else {
				this._hteSensor.classList.remove("active");
			}
		}

		public get factorIn(): number {
			return this._nFactorIn;
		}

		public get factorOut(): number {
			return this._nFactorOut;
		}


		// Public Events
		// -------------------------------------------------------------------
		public get area(): SyncArea {
			return this._area;
		}


		// Internal Members
		// -------------------------------------------------------------------



		// Event Handlers
		// -------------------------------------------------------------------



		// State Machine
		// -------------------------------------------------------------------


	} // class SyncContext


	export enum SyncMediaStates {
		Init,
		Stopped,
		Paused,
		Playing,
		Waiting,
		Error
	}

	enum SyncMediaModes {
		Normal,
		Managed
	}

	enum SyncRelPositions {
		Before,
		Attention,
		Ready,
		Playing,
		After
	}

	export class SyncMedia {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _area: SyncArea;
		private _media: HTMLMediaElement;

		private _bActive: boolean;
		private _ranges: SyncRange[];

		private _suDeferralStart: SyncUnit = 0; // если при старте больше 0, то позиционир.
		private _ranSelected: SyncRange | null;

		private _ranPlaying: SyncRange | null;
		private _nProbeStart: number;

		private _bPlaying: boolean;
		private _nRequestID: number = 0; // для cancelAnimationFrame

		private _eventMediaStateChanged: VSect.EventNest<SyncMediaStates>;


		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(area: SyncArea, media: HTMLMediaElement) {
			this._area = area;
			this._media = media;

			this._bActive = false; // SyncMedia Status
			this._ranges = [];
			this._ranSelected = null;
			//
			this._ranPlaying = null;
			this._nProbeStart = -1;
			//
			this._eventMediaStateChanged = new VSect.EventNest<SyncMediaStates>(this);

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
		public regRange(range: SyncRange | null): void {
			if (range && range.isValid) {
				this._ranges.push(range);
			}
		}

		public completeReg() {
			// сортируем диапазоны по возрастанию
			this._ranges.sort((a: SyncRange, b: SyncRange): number => {
				return (a.startIn === b.startIn) ? 0 : (a.startIn < b.startIn) ? -1 : 1;
			});
		}

		public setActiveStatus(bActive: boolean): void {
			this._bActive = bActive;
			if (this._bActive) {
				this._updateSyncState(this._media.currentTime);
			} else {
				this._updateSyncState(SyncMedia.NOTIME);
			}
		}

		public selectRange(range: SyncRange | null): void {
			const _this: SyncMedia = this;
			//
			if (range && range === this._ranSelected) {
				if (this.state === SyncMediaStates.Playing) {
					this.pause();
					__positionSelected(this._ranSelected);
				} else {
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
			function __positionSelected(ranSelected: SyncRange): void {
				_this._setProbeStartIndex(_this._ranges.indexOf(ranSelected));
				_this.forcePosition(ranSelected.startOut);
			}
		}

		// Public Members
		// -------------------------------------------------------------------
		public static readonly NOTIME: SyncUnit = -1;
		public static readonly SYNC_READY_OFFSET: SyncUnit = 0.2; // получено пробным путём
		public static readonly SYNC_ATTENTION_DISTANCE: SyncUnit = 3;
		public static readonly SYNC_ATTENTION_OFFSET: SyncUnit = 2;

		public get isActive(): boolean {
			return this._bActive;
		}

		public get isPlaying(): boolean {
			return this._bPlaying;
		}

		public get mediaelement(): HTMLMediaElement {
			return this._media;
		}


		public pause(): void {
			this._media.pause();
		}

		public play(): void {
			this._media.play();
		}

		public forcePosition(suPos: SyncUnit): void {
			// experimental (раньше я не проверял!)
			if (isNaN(this._media.duration)) {
				this._suDeferralStart = suPos;
			} else {
				this._media.currentTime = suPos;
			}
		}

		// Public Events
		// -------------------------------------------------------------------
		public get eventMediaStateChanged(): VSect.EventNest<SyncMediaStates> {
			return this._eventMediaStateChanged;
		}


		// Internal Members
		// -------------------------------------------------------------------
		private _bSyncHandlerBusy: boolean = false; // experimental!
		private _updateSyncState(suTimeNow: SyncUnit): void {
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
					} else {
						this._setRangePlaying(null);
						this._setProbeStartIndex(nProbeStart);
					}
					break;
				}
			} // switch
			this._bSyncHandlerBusy = false;
		}

		private _probePositionStraight(nIndexStart: number, suTimeNow: SyncUnit): void {
			let ranAttention: SyncRange | null = null;
			let nAttentionIndex: number = -1;

			let ranReady: SyncRange | null = null;
			let ranNow: SyncRange | null = null;
			let nNowIndex: number = -1;
			//
			// Будем искать вперёд все подряд, пока nTimeNow будет меньше конца очередного диапазона или достигнут конец
			//
			if (nIndexStart < 0) {
				nIndexStart = 0;
			}
			for (let i: number = nIndexStart; i < this._ranges.length; i++) {
				let ran: SyncRange = this._ranges[i];
				let relpos: SyncRelPositions = this._testRangeRelPosition(suTimeNow, ran);

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
				!(nAttentionIndex > 0 && ((ranAttention.startIn - this._ranges[nAttentionIndex - 1].endIn) < SyncMedia.SYNC_ATTENTION_DISTANCE))
			) {

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


		private _setRangePlaying(range: SyncRange | null): void {
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

		private _setProbeStartIndex(nIndexNew: number): void {
			this._nProbeStart = nIndexNew;
		}


		private _testWithinRange(suTimePos: SyncUnit, range: SyncRange): boolean {
			return (suTimePos < range.endIn && (suTimePos >= (range.startIn - SyncMedia.SYNC_READY_OFFSET)));
		}


		private _findProbeStartIndex(suTimePos: SyncUnit): SyncUnit {
			let nProbeStartIndex: number = -1;
			let nIndexLower: number = 0;
			let nIndexUpper: number = this._ranges.length;
			while (true) {
				// пока надеемся, что вых. из бесконечного цмкла произойдёт по одному из break!!!???
				if (nIndexLower >= nIndexUpper) {
					// т.е. конец зондирования
					break;
				}

				let nIndexMiddle: number = (nIndexLower + Math.floor(((nIndexUpper - nIndexLower) / 2)));

				let ranMiddle: SyncRange = this._ranges[nIndexMiddle];
				if (this._testWithinRange(suTimePos, ranMiddle)) {
					nProbeStartIndex = nIndexMiddle;
					break;
				} else {
					if (suTimePos < ranMiddle.startIn) {
						// значит двигаемся вниз
						nIndexUpper = nIndexMiddle;
					} else {
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
		private _testRangeRelPosition(suTimePos: SyncUnit, ran: SyncRange): SyncRelPositions {
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


		private _syncPosition(time: number): void {
			this._updateSyncState(this._media.currentTime);
			if (this.state === SyncMediaStates.Playing) {
				this._nRequestID = requestAnimationFrame(this._syncPosition.bind(this));
			}
		}

		// State Machine
		// -------------------------------------------------------------------

		//
		// Playing States
		//
		private _state: SyncMediaStates = SyncMediaStates.Init;
		private _statePrev: SyncMediaStates = SyncMediaStates.Init;

		private get state(): SyncMediaStates {
			return this._state;
		}

		private set state(stateNew: SyncMediaStates) {
			this._statePrev = this._state;
			this._state = stateNew;
		}

		private _changeState(stateNew: SyncMediaStates): void {
			if (this.state === stateNew) { return; }
			//
			const stateOld: SyncMediaStates = this.state;
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

		//
		// Working Modes
		//
		private _mode: SyncMediaModes = SyncMediaModes.Normal;
		// private _changeMode(modeNew: SyncMediaModes): void {
		// 	if (this._mode === modeNew) { return; }
		// 	this._mode = modeNew;
		// 	switch (this._mode) {
		// 		case SyncMediaModes.Normal: {

		// 			break;
		// 		}
		// 		case SyncMediaModes.Managed: {

		// 			break;
		// 		}
		// 		default: {
		// 			// прозапас
		// 			break;
		// 		}

		// 	} // switch

		// }

	} // class SyncMedia


	declare type IndicationEntryInfo = { entry: SyncEntry | null, top: number, indicator: SVGSVGElement };

	export class SyncArea {
		// Class Variables and Constants
		// -------------------------------------------------------------------
		private _presenter: HTMLElement;
		private _hteScrollOwner: HTMLElement | null;
		private _$hteScrollOwner: JQuery; // для анимации прокрутки

		private _medias: SyncMedia[];
		private _contexts: SyncContext[];
		private _ctxPlaying: SyncContext | null;

		private _nActiveMediaIndex: number;
		private _mediaActive: SyncMedia | null;
		private _bAutoScroll: boolean = true;
		private _bAnimating: boolean = false;

		private _pointerReady: IndicationEntryInfo;
		private _pointerPlaying: IndicationEntryInfo;
		private _pointerPhantom: IndicationEntryInfo;

		private static readonly UNDEFOFFSET: number = -1000;

		// Construction / Initialization / Destruction
		// -------------------------------------------------------------------
		constructor(presenter: HTMLElement, scrollowner: HTMLElement | null = null) {
			this._presenter = presenter;
			//
			if (presenter.dataset.scrollowner) {
				this._hteScrollOwner = presenter.querySelector(presenter.dataset.scrollowner as string);
			} else {
				this._hteScrollOwner = scrollowner;
			}

			this._$hteScrollOwner = (this._hteScrollOwner) ? $(this._hteScrollOwner) : $();
			//
			this._contexts = [];
			this._ctxPlaying = null;
			//
			this._nActiveMediaIndex = -1; // Может (отсчёт от нуля)
			this._mediaActive = null;

			let strAutoscroll: string | undefined = presenter.dataset.autoscroll;
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
			const listCtx: NodeListOf<HTMLElement> = presenter.querySelectorAll(".sync-context");
			for (let i: number = 0; i < listCtx.length; i++) {
				const ctx: SyncContext = new SyncContext(this, listCtx[i]);
				ctx.sensor.addEventListener("click", this._onContextSensorClick.bind(this));
				this._contexts.push(ctx);
			}

			//
			// После того как подготовили синхрообвязку текста, подготавливаем медиаэлементы
			//
			this._medias = [];
			const listPlayer: NodeListOf<HTMLMediaElement> = presenter.querySelectorAll("video,audio");
			for (let i: number = 0; i < listPlayer.length; i++) {
				const player: SyncMedia = new SyncMedia(this, listPlayer[i]);
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
		public indicateAttention(entry: SyncEntry): void {
			this._checkPlayingContext(entry);
			//
			if (!this._pointerPlaying.entry) {
				this._hidePointer(this._pointerPhantom);
				//
				const nIndicatorTop: number = this._calcIndicatorTop(entry);
				if (nIndicatorTop !== SyncArea.UNDEFOFFSET) {
					this._pointerReady.entry = entry;
					this._pointerReady.top = nIndicatorTop;
					this._showPointer(this._pointerReady);
				}
			}
		}

		public indicatePlaying(entry: SyncEntry): void {
			this._checkPlayingContext(entry);
			//
			this._hidePointer(this._pointerReady);
			this._hidePointer(this._pointerPhantom);
			//
			// если проигрывание не идёт, то просто ничего не отображаем
			if (this._mediaActive && this._mediaActive.isPlaying) {
				// на статус entry - не обращаем внимания!
				const nIndicatorTop: number = this._calcIndicatorTop(entry);
				if (nIndicatorTop !== SyncArea.UNDEFOFFSET) {
					this._pointerPlaying.entry = entry;
					this._pointerPlaying.top = nIndicatorTop;
					this._showPointer(this._pointerPlaying);
				}
			} else {
				this._hidePointer(this._pointerPlaying);
			}
		}

		public hideEntryPlaying(): void {
			if (this._pointerPlaying.entry) {
				// переводим в Phantom
				this._pointerPhantom.entry = this._pointerPlaying.entry;
				this._pointerPhantom.top = this._pointerPlaying.top;
				this._showPointer(this._pointerPhantom);
				this._hidePointer(this._pointerPlaying);
			}
		}

		public hideIndicationAll(): void {
			this._hidePointer(this._pointerReady);
			this._hidePointer(this._pointerPlaying);
			this._hidePointer(this._pointerPhantom);
		}


		public get players(): SyncMedia[] {
			return this._medias;
		}

		//

		public selectMe(entry: SyncEntry): void {
			if (this._mediaActive) {
				const nMediaIndex: number = this._medias.indexOf(this._mediaActive);
				if (nMediaIndex >= 0) {
					this._mediaActive.selectRange(entry.getRange(nMediaIndex));
				}
			}
		}


		// Public Events
		// -------------------------------------------------------------------


		// Internal Members
		// -------------------------------------------------------------------
		private _setActiveMedia(_nActiveMediaIndex: number): void {
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

		private _calcIndicatorTop(entry: SyncEntry): number {
			/* // Вариант с JQuery
			let coordEntry: JQuery.Coordinates | undefined = (entry.mark) ? $(entry.mark.presenter).offset() : undefined;
			let coordScope: JQuery.Coordinates | undefined = $(this._presenter).offset();
			return (coordEntry && coordScope) ? coordEntry.top - coordScope.top : SyncScope.UNDEFOFFSET;
			*/

			// я сделал свой (может чуть побыстрее работает?)
			// здесь предполагаем, что entry ассоциирован с mark
			return SyncUtils.getVertOffset((entry.mark as SyncMark).presenter as HTMLElement, this._presenter);
		}

		private _showPointer(pointer: IndicationEntryInfo): void {
			if (this._hteScrollOwner && pointer.entry && pointer.entry.mark) {
				const hteEntryPresenter: HTMLElement = pointer.entry.mark.presenter;
				if (hteEntryPresenter.offsetHeight > 0) { // иначе Entry скрыт (т.е. не имеет высоты) 
					pointer.indicator.style.top = pointer.top.toString() + "px";
					pointer.indicator.style.visibility = "visible";
					//
					if (this._bAutoScroll && this._mediaActive && this._mediaActive.isPlaying) {
						setTimeout(() => { // не уверен, что имеет смысл?!
							this._ensureVisible(pointer);
						}, 0);
					}
				}
			}
		}

		private _ensureVisible(pointer: IndicationEntryInfo): void {
			if (this._bAnimating) {
				return;
			}
			//
			if (pointer.entry && this._hteScrollOwner) {
				const hteEntryPresenter: HTMLElement = (pointer.entry.mark as SyncMark).presenter;
				if (hteEntryPresenter.offsetHeight > 0) {
					let nEntryOffset: number = SyncUtils.getVertOffset(hteEntryPresenter, this._hteScrollOwner);

					const nScrollTop: number = this._hteScrollOwner.scrollTop;
					const nViewThresholdLower: number = this._hteScrollOwner.clientHeight - (hteEntryPresenter.offsetHeight * 1.5);
					const nViewThresholdUpper: number = this._hteScrollOwner.clientHeight / 2;

					if (nEntryOffset < 0) {
						let nScrollTopNew: number = (nScrollTop + nEntryOffset) - SyncUtils.sepfactor; // 07-Oct-2019
						if (nScrollTopNew < 0) { nScrollTopNew = 0; }
						this._bAnimating = true;
						this._$hteScrollOwner.animate({ scrollTop: nScrollTopNew }, 500, () => {
							this._bAnimating = false;
							this._$hteScrollOwner.finish();
						});
					} else {
						const nEntryOffsetBottom: number = (nEntryOffset + hteEntryPresenter.offsetHeight);
						if (nEntryOffsetBottom > nViewThresholdLower) {
							// надо скроллировать вверх (т.е. вниз)
							this._bAnimating = true;
							let nScrollTopDesired: number = nScrollTop + (nEntryOffset - nViewThresholdUpper);
							this._$hteScrollOwner.animate({ scrollTop: nScrollTopDesired }, 500, () => {
								this._bAnimating = false;
								this._$hteScrollOwner.finish();
							});
						}
					}
				} // if (hteEntryPresenter.offsetHeight > 0)
			} // if (pointer.entry && this._hteScrollOwner)
		}

		private _hidePointer(pointer: IndicationEntryInfo): void {
			pointer.indicator.style.visibility = "hidden";
			pointer.entry = null;
			pointer.top = -100; // чтоб больше высоты индикатора
		}

		private _setPlayingContext(ctx: SyncContext | null): void {
			if (this._ctxPlaying) {
				this._ctxPlaying.setActive(false);
			}
			//
			this._ctxPlaying = ctx;
			if (this._ctxPlaying) {
				this._ctxPlaying.setActive(true);
			}
		}

		private _checkPlayingContext(entry: SyncEntry): void {
			if (this._mediaActive && this._mediaActive.isPlaying && this._ctxPlaying !== entry.context) {
				this._setPlayingContext(entry.context);
			}
		}

		// Event Handlers
		// -------------------------------------------------------------------

		/* Grigory! Новая модель жестов - изменить на одинар нажатие/стоп/пуск*/
		private _onContextSensorClick(ev: Event): void {
			if (this._mediaActive) {
				//
				// Запустить/Остановить проигрывание
				//
				if (this._mediaActive.isPlaying) {
					this._mediaActive.pause();

				} else {
					this._mediaActive.play();
				}
			}
		}

		private _onMediaStateChanged(sender: SyncMedia, stateNew: SyncMediaStates): void {
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

		// State Machine
		// -------------------------------------------------------------------


	} // class SyncArea

} // namespace MediaSync
