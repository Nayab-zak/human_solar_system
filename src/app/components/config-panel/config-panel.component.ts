import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ClusterService } from '../../services/cluster.service';

@Component({
  selector: 'app-config-panel',
  templateUrl: './config-panel.component.html',
  styleUrls: ['./config-panel.component.scss']
})
export class ConfigPanelComponent implements OnInit {
  configForm!: FormGroup;

  constructor(private fb: FormBuilder, private clusterService: ClusterService) {}

  ngOnInit(): void {
    this.configForm = this.fb.group({
      nodeCount: [10],
      attrCount: [3],
      kAttract: [50],
      kRep: [50],
      damping: [0.95],
      lowPower: [false]
    });
    this.configForm.valueChanges.pipe(debounceTime(150)).subscribe(val => {
      this.clusterService.updateOptions(val);
    });
  }
}
