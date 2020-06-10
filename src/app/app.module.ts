import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { AppComponent } from './app.component';
import { environment } from '../environments/environment';

const MATERIAL_MODULE = [
  MatFormFieldModule,
  MatToolbarModule,
  MatIconModule,
  MatButtonModule,
  MatInputModule,
  MatSelectModule,
  MatCardModule,
  MatCheckboxModule
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    MATERIAL_MODULE,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  declarations: [
    AppComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
