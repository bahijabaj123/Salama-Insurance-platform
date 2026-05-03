import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-client-simple-page',
  imports: [],
  templateUrl: './client-simple-page.component.html',
  styleUrl: './client-simple-page.component.scss'
})
export class ClientSimplePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  title = 'Page';
  subtitle = '';

  ngOnInit(): void {
    const data = this.route.snapshot.data;
    this.title = typeof data['title'] === 'string' ? data['title'] : 'Page';
    this.subtitle = typeof data['subtitle'] === 'string' ? data['subtitle'] : '';
  }
}
