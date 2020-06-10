import { Component, OnInit } from '@angular/core';
import { strengthList } from './util/length-util';
import { environment } from '../environments/environment.prod';

const numberChars = '0123456789';
const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lowerChars = 'abcdefghiklmnopqrstuvwxyz';
const specialChars = '!@#$%^&*(){}[]_+?></=';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  version = environment.version;

  strengthList = strengthList();
  selectedStrength: string;

  isCheckedNumber = true;
  isCheckedLower = true;
  isCheckedUpper = false;
  isCheckedSymbols = false;

  result: string;

  constructor() { }

  ngOnInit(): void {
    this.selectedStrength = this.strengthList[0].key;
  }

  onGeneratePassword() {
    let lengthModel = this.strengthList.find(x => x.key == this.selectedStrength);
    this.result = this.generatePassword(lengthModel.length);
  }

  generatePassword(passwordLength) {
    let allChars = '';
    let randPasswordArray = Array(passwordLength);
    if (this.isCheckedNumber) allChars += numberChars;
    if (this.isCheckedUpper) allChars += upperChars;
    if (this.isCheckedLower) allChars += lowerChars;
    if (this.isCheckedSymbols) allChars += specialChars;
    randPasswordArray = randPasswordArray.fill(allChars, 0);
    return shuffleArray(randPasswordArray.map(function (x) { return x[Math.floor(Math.random() * x.length)]; })).join('');

    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
      }
      return array;
    }
  }
}
