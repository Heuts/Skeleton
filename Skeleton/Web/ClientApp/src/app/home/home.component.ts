import { Component, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../injection-tokens/api-base-url-tokens';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  values: string[];
  private baseUrl: string;

  constructor(
    private http: HttpClient,
    @Inject(API_BASE_URL) private apiServerUrl: string
  ) {
    this.baseUrl = `${apiServerUrl}/api/values`;
    this.apiConnectionTest().subscribe(res => (this.values = res));
  }

  apiConnectionTest() {
    return this.http.get<string[]>(`${this.baseUrl}/`);
  }
}
