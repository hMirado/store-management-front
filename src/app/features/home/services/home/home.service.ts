import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from 'src/app/core/models/api-response/api-response.model';
import { ApiService } from 'src/app/core/services/api/api.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HomeService {

  constructor(private apiService: ApiService) { }

  openShop(shopUuid: string, status: boolean): Observable<ApiResponse> {
    const url = `${environment['store-service']}/shop/open/${shopUuid}`;
    return this.apiService.doPut(url, {status: status})
  }

  getShopByUuid(shopUuid: string): Observable<ApiResponse> {
    const url = `${environment['store-service']}/shop/${shopUuid}`;
    return this.apiService.doGet(url);
  }
}
