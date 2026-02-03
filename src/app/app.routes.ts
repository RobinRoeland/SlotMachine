import { Routes } from '@angular/router';
import { ItemEditorComponent } from '../../Pages/item-editor/item-editor.component';
import { GameComponent } from '../../Components/game/game.component';
import { TestGameComponent } from '../../Components/test-game/test-game.component';
import { HomeComponent } from '../../Pages/home/home.component';
import { PrizesComponent } from '../../Pages/prizes/prizes.component';
import { OddsComponent } from '../../Pages/odds/odds.component';
import { SettingsComponent } from '../../Pages/settings/settings.component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomeComponent,
    title: 'Games'
  },
  { 
    path: 'game', 
    component: GameComponent,
    title: 'Prize Machine'
  },
  {
    path: 'test-game',
    component: TestGameComponent,
    title: 'Test Game'
  },
  { 
    path: 'edit-items', 
    component: ItemEditorComponent,
    title: 'Edit Items'
  },
  {
    path: 'edit-prizes',
    component: PrizesComponent,
    title: 'Edit Prizes'
  },
  {
    path: 'edit-odds',
    component: OddsComponent,
    title: 'Edit Odds'
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: 'Settings'
  },
  { 
    path: '', 
    redirectTo: '/home', 
    pathMatch: 'full' 
  }
];
