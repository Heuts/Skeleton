## Opzetten webapplicatie met Web API en Angular client in ASP.NET Core

### Inleiding
In deze handleiding zullen we een ASP.NET Core Api koppelen aan een Web Angular 7+ front-end. In dit voorbeeld is gebruik gemaakt van ASP .NET Core 2.2 API en een Angular 7 front-end. Voor het aanmaken van projecten is Visual Studio 2019 16.2.0 gebruikt en voor de code is Visual Studio Code 1.36.1 gebruikt. Ook moet node.js geïnstalleerd zijn, in dit voorbeeld is 10.16.2 geïnstalleerd.


#### Aanmaken projecten
1.	Maak een nieuw project aan in Visual Studio  Create a new project
2.	Selecteer ASP.NET Core Web Application en klik Next
3.	Kies een naam voor het project en een naam voor de solution en klik Create
4.	Zorg dat bovenin het scherm .NET Core en de meest recent stable versie van ASP.NET Core geselecteerd zijn.
5.	Selecteer voor de API van de applicatie API, selecteer Configure for HTTPS en klik Create
6.	Je hebt nu de API gemaakt
7.	Klik nu met rechtermuisknop op de solution in Solution Explorer en ga naar Add  New Project
8.	Selecteer ASP.NET Core Web Application en klik Next
9.	Kies de naam van de Web(Front-End) van de applicatie en klik Create
10.	Zorg dat bovenin het scherm .NET Core en de meest recent stable versie van ASP.NET Core geselecteerd zijn.
11.	Selecteer voor de Web(Front-End) van de applicatie nu Angular, selecteer Configure for HTTPS en klik Create
12.	Je hebt nu beide projecten aangemaakt


#### Appsettings
De variabelen zoals de url van de api en de web worden opgeslagen in de appsettings van de projecten. In deze sectie zullen we deze variabelen toevoegen. In de appsettings.development zetten we de localhost urls. In de “normale” appsettings zetten we de We zetten de value van deze variabele op “TOSET”, omdat deze value tijdens de release in Azure DevOps wordt bepaalt.

1.	Rechtermuisknop op het project voor de Web  Properties  Debug  Selecteer hier Enable SSL en kopieer het adres wat hier rechts van verschijnt.
2.	Open de appsettings.Development.json van de API en voeg het volgende stukje code toe:
```json
"Web": {
    "SchemeAndHost": "{{ plak localhost van web hier }}"
  }
```

3.	Open de appsettings.json van de API en voeg het volgende stukje code toe:
```json
"Web": {
    "SchemeAndHost": "TOSET"
  }
```
We zetten de value van deze variabele op “TOSET”, omdat deze value tijdens de release in Azure DevOps wordt bepaalt.

4.	Rechtermuisknop op het project van de API  Properties  Debug  Selecteer hier Enable SSL en kopieer het adres wat hier rechts van verschijnt.

5.	Open de appsettings.Development.json van de Web en voeg het volgende stukje code toe:
```json
"ApiServer": {
    "SchemeAndHost": "{{ plak adres van api hier }}"
  }
```
6.	Open de appsettings.json van de Web en voeg het volgende stukje code toe:
```json
"ApiServer": {
    "SchemeAndHost": "TOSET"
  }
```

#### Instellen CORS
Om de Web toestemming te geven om de API aan te roepen, moeten we de CORS(Cross-Origin Resource Sharing) implementeren in de API. Je kan hier meer over CORS lezen: https://www.html5rocks.com/en/tutorials/cors/ 
Ook wordt hier de value uit de appsettings opgehaald, zodat hij de juiste value gebruikt, afhankelijk van in welke omgeving je hem opstart (development of Azure release)
1.	Hiervoor gaan we de Startup.cs klasse in de API en voegen we het onderstaande stukje code toe aan de ConfigureServices() methode:
```csharp
services.AddCors(options =>
            {
                options.AddPolicy("AllowSpecificOrigin", policy =>
                {                         
               policy.WithOrigins(Configuration.GetSection
                    ("Web:SchemeAndHost").Value)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });
```
2.	In de Configure() methode in dezelfde klasse voegen we het volgende stukje code toe:
```csharp
app.UseCors("AllowSpecificOrigin");
```

#### Testen connectie
Als alles goed is gegaan, kunnen de Web en de API nu communiceren. Dit kunnen we testen door de automatisch gecreëerde ValuesController.cs in de API vanuit de Web aan te roepen.
1.	We kunnen in de automatisch gecreëerde home component dit doen. Ga naar de file home.component.ts in de WEB (Web/src/app/home) en vervang de code met het onderstaande:

**LET OP:** Vervang de url met de url van de API in jouw betreffende applicatie!
```typescript
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  values: string[];

  constructor(private http: HttpClient) {
    this.apiConnectionTest().subscribe(res => (this.values = res));
  }

  apiConnectionTest() {
    return this.http.get<string[]>('https://localhost:44397/api/values');
  }
}
```

2.	En in de home.component.html vervangen we de code door het volgende:
```html
<h1>{{ values }}</h1>
```
We kunnen nu het programma runnen (API + WEB) en zullen de values (“value1, value2”) vanuit de ValuesController uit de API in de home component zien 😊.


#### Injection token voor API_BASE_URL
We kunnen de url voor de API het beste via injection token ophalen, omdat de API url geen runtime representation heeft (hij heeft in de azure omgeving een andere waarde dan in de local omgeving).
1.	Hiervoor voegen we een nieuwe folder injection-tokens aan onze angular web app toe met daarin de file api-base-url-token.ts. Deze typescript file ziet er als volgt uit:
```typescript
import { InjectionToken } from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
```
Configservice & configDto
2.	Hierna maken we in de src/app een nieuwe map genaamd services aan, en maken hierin een service genaamd config.service.ts. Deze service ziet er als volgt uit:
```typescript
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
```
3.	We moeten ook een config.dto aanmaken. Maak in de src/app een map genaamd dto aan en maak hierin de file config.dto.ts. Deze ziet er als volgt uit:
```typescript
export interface ConfigDto {
  apiServerUrl: string;
}
```
4.	Vervolgens voegen we in de app.module.ts twee functies toe:
```typescript
export function init(configService: ConfigService): Function {
  return () => {
    const cachePromise = configService.loadCache();
    return Promise.all([cachePromise]);
  };
}

export function getApiBaseUrlFactory(configService: ConfigService) {
  return configService.getCachedConfig().apiServerUrl;
}
```
Ook voegen we in de app.module.ts onder providers het volgende toe: 
```typescript
providers: [
    ConfigService,
    {
      provide: API_BASE_URL,
      useFactory: getApiBaseUrlFactory,
      deps: [ConfigService]
    },
    {
      provide: APP_INITIALIZER,
      useFactory: init,
      deps: [ConfigService],
      multi: true
    }
  ],
```


#### ConfigController
We moeten nu in de Controllers map in de Web een C# controller toevoegen en een C# klasse waarvan de properties gelijk zijn aan de ConfigDto die we in de vorige stap hebben gemaakt. 
1.	De controller ziet er als volgt uit: 
```csharp
[Route("api/Config")]
    public class ConfigController : Controller
    {
        private IConfiguration config;

        public ConfigController(IConfiguration configuration)
        {
            config = configuration;
        }

        [HttpGet]
        public ConfigDto Index()
        {
            return new ConfigDto
            {
                ApiServerUrl = config["ApiServer:SchemeAndHost"],
            };
        }
    }
```
2.	Maak in de Web solution een map aan genaamd ‘DTO’ en voeg hier de ConfigDto klasse toe. De ConfigDto class ziet er als volgt uit:
```csharp
public class ConfigDto
    {
        public string ApiServerUrl { get; set; }
    }
}
```
**LET OP:** in projecten die .NET Core 3.0+ gebruik maken moet je bij deze property een getter en setter aanmaken  public string ApiServerUrl {get; set;}


#### Testen nieuwe connectie
We hebben er nu voor gezorgd dat de web de url van api kan ophalen via ConfigController, config-service en de injection token. We kunnen dit nu gaan testen door onze home component hier op aan te passen. Verander de home.component.ts file zodat hij er als volgt uit ziet. 
```typescript
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
```
Als we het project nu runnen zien we in de html van de home component als het goed is de strings value1 en value2 staan.
