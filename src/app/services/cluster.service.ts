import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClusterService {
  private optionsSubject = new BehaviorSubject<any>({});
  options$ = this.optionsSubject.asObservable();

  updateOptions(opts: any) {
    this.optionsSubject.next(opts);
    // TODO: propagate to PhysicsService/Cluster as needed
  }
}
