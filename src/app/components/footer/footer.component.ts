import { magma } from '@/constants/magmaChain';
import { WalletAddressDirective } from '@/directives/wallet-address.directive';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
  standalone: true,
  imports: [ CommonModule, WalletAddressDirective],
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})

export class FooterComponent implements OnInit {

  explorerUrl = environment.explorerUrl;

  version = environment.version;
  marketAddress = environment.marketAddress;
  points = environment.pointsAddress;
  contributions = environment.donationsAddress;

  layer1Bridge = environment.bridgeAddress;
  layer2Bridge = environment.bridgeAddressL2;
  layer2Market = environment.marketAddressL2;

  layer2ExplorerUrl = magma.blockExplorers.default.url;

  constructor() { }

  ngOnInit(): void {
  }
}
