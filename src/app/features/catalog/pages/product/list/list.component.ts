import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, debounceTime, switchMap, of, filter } from 'rxjs';
import { responseStatus } from 'src/app/core/config/constant';
import { ApiResponse } from 'src/app/core/models/api-response/api-response.model';
import { NotificationService } from 'src/app/core/services/notification/notification.service';
import { ADMIN, inputTimer, userInfo } from 'src/app/shared/config/constant';
import { BreadCrumb } from 'src/app/shared/models/bread-crumb/bread-crumb.model';
import { IInfoBox } from 'src/app/shared/models/i-info-box/i-info-box';
import { ITableFilterFieldValue, ITableFilter, ITableFilterSearchValue } from 'src/app/shared/models/i-table-filter/i-table-filter';
import { IRow, ITable, ICell } from 'src/app/shared/models/table/i-table';
import { HelperService } from 'src/app/shared/services/helper/helper.service';
import { LocalStorageService } from 'src/app/shared/services/local-storage/local-storage.service';
import { ModalService } from 'src/app/shared/services/modal/modal.service';
import { TableFilterService } from 'src/app/shared/services/table-filter/table-filter.service';
import { TableService } from 'src/app/shared/services/table/table.service';
import { tableProductId, tableProductHeader, exportProductConfig } from '../../../config/constant';
import { Category } from '../../../models/category/category.model';
import { Product } from '../../../models/product/product.model';
import { CategoryService } from '../../../service/category/category.service';
import { ProductService } from '../../../service/product/product.service';
import { ExportService } from 'src/app/shared/services/export/export.service';
import { FileService } from 'src/app/shared/services/file/file.service';
import { IBase64File } from 'src/app/shared/models/file/i-base64-file';
import { ImportService } from 'src/app/shared/services/import/import.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit, OnDestroy {
  public title: string = 'Articles';
  public breadCrumbs: BreadCrumb[] = [];
  private subscription = new Subscription();
  public productNumber: number = 0;
  public uniqueIdProduct: string = 'product-id';
  public tableId: string = tableProductId;
  private rows: IRow[] = [];
  public currentPage: number = 0;
  public lastPage: number = 0;
  public nextPage: number = 0;
  public totalPages: number = 0;
  public totalItems: number = 0;
  public infoBoxProductCount!: IInfoBox;
  public productFormGroup!: FormGroup;
  public categories: Category[] = [];
  public searchCategories: Category[] = [];
  public formError: boolean = false;
  public modalConfirmationID: string = 'confirm-id';
  public created: number = 0;
  public error: number = 0;
  public errorValues: any[] = [];
  private params: any = {};
  private userData: any;
  public importConfig = {
    label: 'Importer',
    accept: 'xlsx/xls',
    validation: {
      encoding: ['utf8'],
      maxSize: 1024 * 10,
    }
  }

  public exportConfig = exportProductConfig;

  constructor(
    private productService: ProductService,
    private notificationService: NotificationService,
    private tableService: TableService,
    private helperService: HelperService,
    private formBuilder: FormBuilder,
    private modalService: ModalService,
    private categoryService: CategoryService,
    private router: Router,
    private tableFilterService: TableFilterService,
    private localStorageService: LocalStorageService,
    private exportService: ExportService,
    private fileService: FileService,
    private importService: ImportService
  ) {
    this.createForm();
  }

  ngOnInit(): void {
    this.addHeaderContent();
    this.countProduct();
    this.getProducts();
    this.addFormField();
    this.cancel();
    this.getCategories();
    this.getFilterValue();
    this.getUserData();
    this.getPriceValue();
    this.getTableAction();
    this.getFileModel();
    this.getFileValid();
    this.confirmImport();
  }

  ngOnDestroy(): void {
    this.helperService.reset();
    this.subscription.unsubscribe();
  }

  addHeaderContent() {
    this.breadCrumbs = [
      {
        url: '/',
        label: 'Accueil',
      },
      {
        label: 'Catalogues',
      },
      {
        label: 'Articles'
      }
    ]
  }

  countProduct() {
    this.subscription.add(
      this.productService.countProduct().subscribe((response: ApiResponse) => {
        if (response.status == responseStatus.success) {
          this.productNumber = response.data;
          this.infoBoxProductCount =  {
            id: 'product',
            bg: 'bg-info',
            icon: ' fa-gamepad',
            number: this.productNumber,
            text: 'Total article(s)'
          }
        }
      })
    );
  }

  getProducts() {
    this.subscription.add(
      this.productService.getProducts().subscribe((response: ApiResponse) => this.getProductsResponse(response))
    );
  }

  getProductsResponse(response: ApiResponse) {
    let table: ITable = {
      id: this.tableId,
      header: [],
      body: null
    }
    if (response.status == responseStatus.success) {
      this.rows = [];
      let products: Product[] = response.data.items;
      products.forEach((product: Product) => {
        let row: IRow = this.productService.addTableRowValue(product);
        this.rows.push(row);
      });
      let cells: ICell = {
        cellValue: this.rows,
        paginate: true,
        isEditable: true,
      };
      table.header = tableProductHeader;
      table.body = cells;
      this.tableService.setTableValue(table);
      this.currentPage = response.data.currentPage;
      this.lastPage = this.currentPage == 1 ? 0 : this.currentPage - 1;
      this.nextPage = response.data.totalPages == this.currentPage ? this.currentPage : this.currentPage + 1;
      this.totalPages = response.data.totalPages;
      this.totalItems = response.data.totalItems;
    }
  }

  /**
   * @description Notification
   * @param type
   * @param message
   */
  showNotification(type: string, message: string) {
    this.notificationService.addNotification({
      type: type,
      message: message
    })
  }

  createProduct() {
    this.router.navigateByUrl('catalog/product/create');
  }

  openModal(id: string) {
    this.modalService.showModal(id)
  }

  closeModal(id: string) {
    this.modalService.hideModal(id)
  }

  createForm() {
    this.productFormGroup = this.formBuilder.group({
      product: this.formBuilder.array([]),
    });
  }

  get productForm(): FormArray {
    return this.productFormGroup.get('product') as FormArray;
  }

  addFormField() {
    this.searchCategories = this.categories;
    this.productForm.push(
      this.formBuilder.group({
        code: ['', Validators.required],
        label: ['', Validators.required],
        isSerializable: false,
        category: ['', Validators.required],
        price: ['', Validators.required]
      })
    )
  }

  removeLabel(i: number) {
    this.productForm.removeAt(i);
    this.searchCategories = this.categories;
  }

  cancel() {
    this.subscription.add(
      this.modalService.isCanceled$.subscribe((status: boolean) => {
        if (status) {
          this.productFormGroup.reset();
          this.productForm.clear();
          this.addFormField();
          this.searchCategories = this.categories;
        }
      })
    )
  }

  getCategories() {
    this.subscription.add(
      this.categoryService.getCategories().subscribe((response: ApiResponse) => this.getCategoriesResponse(response))
    );
  }

  getCategoriesResponse(response: ApiResponse) {
    if (response.status == responseStatus.success) {
      this.categories = response.data;
      this.searchCategories = response.data;
      this.productFilter(this.categories);
    }
  }

  getCategoriesValueChange(i: number) {
    this.searchCategories = this.categories;
    const category = this.productForm?.at(i).get('category')
    if (category) {
      this.subscription.add(
        category.valueChanges.pipe(
          debounceTime(inputTimer),
          switchMap((category: string) => {
            if (category == '') {
             return of(this.categories)
            } else {
              this.searchCategories = this.categories.filter(x =>  x.label.toLowerCase().includes(category.toLowerCase()));
              const result = this.categories.filter(x =>  x.label.toLowerCase().includes(category.toLowerCase()));
              return of(result);
            }
          })
        ).subscribe(response => {
          this.searchCategories = response
        })
      );
    }
  }

  createItems() {
    if (!this.productForm.valid) {
      this.formError = true;
    } else {
      this.formError = false;
      const products = this.productForm.value.map((x: any) => {
        return {
          code: x.code,
          label: x.label,
          is_serializable: x.isSerializable,
          fk_category_id: this.categories.filter(category => category.label.toLowerCase() == x.category.toLowerCase())[0].category_id,
          price: x.price
        }
      });
      this.saveItems(products);
    }
  }

  saveItems(products: Product[]) {
    this.subscription.add(
      this.productService.createMultiProduct(products).subscribe((response:ApiResponse) => {
        this.productFormGroup.reset();
        this.productForm.clear();
        this.countProduct();
        this.getProducts();
        this.getCategories();
        this.closeModal(this.uniqueIdProduct);
        this.addFormField();
      })
    );
  }

  closeConfirmModal() {
    this.closeModal(this.modalConfirmationID);
    this.created = 0;
    this.error = 0;
    this.errorValues = [];
    this.countProduct();
    this.getProducts();
    this.getCategories();
  }

  productFilter(categories: Category[]) {
    const categorieFilter: ITableFilterFieldValue[] = [
      {
        key: 'category',
        label: 'Tous',
        value: 'all',
        default: true
      }, 
      ...categories.map((category: Category) => {
        const filter = {
          key: 'category',
          label: category.label,
          value: category.category_uuid
        }
        return filter;
      })
    ];
    
    let filter: ITableFilter = { id: 'product-filter', title: '', fields: [] };
    filter.fields = [
      {
        key: 'keyword',
        label: "Mots clé",
        type: 'input',
        placeholder: 'Article / Code article'
      },
      {
        key: 'category',
        label: "Catégories",
        type: 'autoComplete',
        value: categorieFilter,
      }
    ];
    this.tableFilterService.setFilterData(filter);
  }

  getFilterValue() {
    this.subscription.add(
      this.tableFilterService.filterFormValue$.pipe(
        filter((filter: ITableFilterSearchValue|null) => filter != null && filter?.id == 'product-filter'),
        switchMap((filter: ITableFilterSearchValue|null) => {
          this.rows = [];
          this.params['page'] = 1;
          this.params = { ...this.params, ... filter?.value };
          return this.productService.getProducts(this.params);
        })
      ).subscribe((response: ApiResponse) => this.getProductsResponse(response))
    );
  }

  goToNextPage(page: number){
    this.params['page'] = page;
    this.productService.getProducts(this.params).subscribe((response: ApiResponse) => this.getProductsResponse(response));
  }

  getPriceValue() {
    this.subscription.add(
      this.tableService.expandUiid$.pipe(
        switchMap((uuid: string) => {
          const shop = this.userData.role.role_key != ADMIN ? this.userData.shops[0].shop_id : ''
          if (uuid && uuid != '') {
            return this.productService.getProductPrice(uuid, shop);
          } else {
            return []
          }
        })
      ).subscribe((response: ApiResponse) => {
        let rows: IRow[] = []
        response.data.forEach((price: any) => {
          const row = this.productService.getPriceRow(price);
          rows.push(row)
        })
        let cells: ICell = {
          paginate: false,
          cellValue: rows
        };
        this.tableService.setExpandedValue(cells)
      })
    )
  }

  getUserData() {
    const data = this.localStorageService.getLocalStorage(userInfo);
    this.userData = JSON.parse(this.helperService.decrypt(data));
  }

  getTableAction() {
    this.subscription.add(
      this.tableService.getlineId().subscribe((value: any) => {
        if (value && value['id'] != '' && value['action'] == 'edit') this.router.navigateByUrl(`/catalog/product/detail/${value['id']}`);
      })
    );
  }

  getFileModel() {
    this.subscription.add(
      this.exportService.getIsExportValue().pipe(
        filter((value) => value.id == 'product-export' && value.status),
        switchMap((value) => this.productService.getProductModel())
      ).subscribe((response: ApiResponse) => this.downloadFile(response.data, 'product'))
    );
  }

  downloadFile(file: string, fileName: string) {
    const byteCharacters = window.atob(file);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    let blob = new Blob([byteArray], { type: 'xlsx/xls' });

    let link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName + '.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  private file: any;
  getFileValid(): void {
    this.subscription.add(
      this.fileService.base64File$.pipe(
        filter((base64: IBase64File) => base64.id == 'product-import' && base64.file != null)
      ).subscribe((base64: IBase64File) => {
        this.importService.setConfirmImportData({
          id: 'import',
          title: 'IMPORTER LES CATEGORIES D\'ARTICLES',
          text: 'Vous êtes sur le point d\'importer un fichier EXCEL contenant les catégories d\'articles.'
        })
        this.file = base64.file;
      })
    );
  }

  confirmImport(): void {
    this.subscription.add(
      this.importService.getConfirmImport().pipe(
        filter(value => value.id == 'import' && value.status && this.file != ''),
        switchMap(value => {
          return this.productService.importProduct(this.file)
        })
      ).subscribe((response: ApiResponse) => {
        this.modalService.hideModal('import');
        const result = {
          id: 'import-result',
          fileName: 'erreur-product',
          ... response.data
        }
        this.importService.setResult(result);
        this.getProducts();
      })
    )
  }
}
