import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TuiRoot } from '@taiga-ui/core';

@Component({
  imports: [RouterModule, TuiRoot],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'ui';
}
