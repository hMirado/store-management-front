import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthenticationGuard } from 'src/app/shared/guards/authentication/authentication.guard';
import { SaleComponent } from './page/sale/sale.component';

const routes: Routes = [
  {
    path: '',
    component: SaleComponent,
    canActivate: [AuthenticationGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SaleRoutingModule { }
