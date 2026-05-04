import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { AccidentComponent } from './features/accident/accident.component';

@NgModule({
 // declarations: [AccidentComponent],
 imports: [BrowserModule, FormsModule, AccidentComponent],
  providers: [provideHttpClient(withFetch())],
  //bootstrap: [AccidentComponent]
    bootstrap: []

})
export class AppModule {}