import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { publishReplay, refCount, map } from 'rxjs/operators';
import { ConfigDto } from '../DTO/config.dto';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private webServerUrl: string;
  private cachedConfig: ConfigDto;
  private config$: Observable<ConfigDto>;

  constructor(
    @Inject('BASE_URL') private baseUrl: string,
    private http: HttpClient
  ) {
    this.webServerUrl = ConfigService.toUrlBase(baseUrl);
    this.config$ = this.CreateConfig$();
  }

  public static toUrlBase(url: string): string {
    // Get base address, without any trailing slashes or paths
    const base = /^(.*?:\/\/)?([\w\-]*\.?)+(\.\w{2,})?(:?\d{1,5})?/.exec(url);
    if (base != null) {
      return base[0];
    } else {
      console.error('Could not match address!');
      throw new Error('Could not match address!');
    }
  }

  public loadCache(): Promise<any> {
    return this.config$.toPromise().then(c => (this.cachedConfig = c));
  }

  CreateConfig$(): Observable<ConfigDto> {
    return this.http.get<ConfigDto>(`${this.webServerUrl}/api/config`).pipe(
      publishReplay(1),
      refCount()
    );
  }

  getConfig$(): Observable<ConfigDto> {
    return this.config$;
  }

  getCachedConfig(): ConfigDto {
    return this.cachedConfig;
  }

  getAllowedUrls(): Observable<string[]> {
    return this.config$.pipe(map(cfg => [cfg.apiServerUrl]));
  }
}
