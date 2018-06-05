import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { MatButtonModule, MatIconModule, MatToolbarModule } from '@angular/material';

import { AppComponent } from './app.component';

const MATERIAL_MODULE = [
  MatToolbarModule,
  MatIconModule,
  MatButtonModule
];

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MATERIAL_MODULE
  ],
  declarations: [
    AppComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
