import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Table } from '../../models/table/table.model';
import { TableauService } from '../../services/table/tableau.service';
import { Line } from '../../models/table/body/line/line.model';
import { NewColValue } from '../../models/table/validations/new-col-value';

@Component({
  selector: 'app-tableau',
  templateUrl: './tableau.component.html',
  styleUrls: ['./tableau.component.scss']
})
export class TableauComponent implements OnInit, OnDestroy {
  @Input() public id: string;
  public table!: Table;
  private subscription = new Subscription();
  public expandedId: string = '';
  public expandedLines: Line[] = [];

  constructor(
    private tableauService: TableauService
  ) { }

  ngOnInit(): void {
    this.getTable();
    //this.getColumnNewValue();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  getTable(): void {
    this.subscription.add(
      this.tableauService.getTable().subscribe((data: Table) => {
        this.expandedLines = [];
        if (data != null && data.id == this.id) this.table = data
      })
    );
  }

  getColumnId(i: number, j: number, k: number): string {
    return `${i}-${j}-${k}`;
  }

  getInputValue(event: any): void {
    const value = {
      tableId: this.id,
      indexes: event['id'],
      line: event['line'],
      value: event['value']
    }
    this.tableauService.setTableInputValue(value)
  }

  getColumnNewValue() {
    this.subscription.add(
      this.tableauService.getColumn().subscribe((value: NewColValue) => {
        if (this.id == value.tableId) {
          console.log(value);
          console.log(this.table.body);
          
        }
      })
    )
  }
}
