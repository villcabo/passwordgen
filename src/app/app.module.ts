import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ServiceWorkerModule } from '@angular/service-worker';
import {
  MatButtonModule,
  MatCardModule, MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatSelectModule,
  MatToolbarModule
} from '@angular/material';

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
    ServiceWorkerModule.register('/ngsw-worker.js', { enabled: environment.production })
  ],
  declarations: [
    AppComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
