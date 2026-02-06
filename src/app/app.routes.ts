import { Routes } from '@angular/router';
import { ItemEditorComponent } from '../../Pages/item-editor/item-editor.component';
import { SlotMachineComponent } from '../../Components/slot-machine/slot-machine/slot-machine.component';
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
    path: 'slotmachine', 
    component: SlotMachineComponent,
    title: 'Prize Machine'
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
