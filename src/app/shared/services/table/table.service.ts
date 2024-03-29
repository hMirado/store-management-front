import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { ICell, ITable, InputValue } from '../../models/table/i-table';

@Injectable({
  providedIn: 'root'
})
export class TableService {
  public table$: BehaviorSubject<ITable|null> = new BehaviorSubject<ITable|null>(null);
  public expandUiid$: Subject<string> = new Subject<string>();
  public tableExpandedValue$: BehaviorSubject<ICell|null> = new BehaviorSubject<ICell|null>(null);
  private detailId$: Subject<string> = new Subject<string>();
  private lineId$: Subject<{id: string, action: string}> = new Subject<{id: string, action: string}>();
  private inputValue$: Subject<InputValue>= new Subject<InputValue>();
  private tableValueEdited$: Subject<any> = new Subject<any>();

  constructor() { }

  setTableValue(value: ITable): void {
    this.table$.next(value);
  }

  setExpandUuid (uuid: string): void {
    this.expandUiid$.next(uuid);
  }

  setExpandedValue(value: ICell): void {
    this.tableExpandedValue$.next(value);
  }

  setDetailId(uuid: string): void {
    this.detailId$.next(uuid);
  }

  getDetailId(): Observable<string> {
    return this.detailId$;
  }

  setLineId(value: {id: string, action: string}): void {
    this.lineId$.next(value);
  }

  getlineId(): Observable<{id: string, action: string}> {
    return this.lineId$;
  }

  setInputValue(value: InputValue): void {
    this.inputValue$.next(value);
  }

  getInputValue(): Observable<InputValue> {
    return this.inputValue$;
  }

  setTableValueEdited(value: any): void {
    this.tableValueEdited$.next(value);
  }

  getTableValueEdited(): Observable<any> {
    return this.tableValueEdited$;
  }
}
