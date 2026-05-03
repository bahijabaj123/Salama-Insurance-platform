import { Pipe, PipeTransform } from '@angular/core';
import { Claim } from '../models/claim.model';

@Pipe({
  name: 'filterHasExpert',
  standalone: true
})
export class FilterHasExpertPipe implements PipeTransform {
  transform(claims: Claim[] | null | undefined): number {
    if (!claims || !Array.isArray(claims)) return 0;
    return claims.filter(claim => claim.expert !== null && claim.expert !== undefined).length;
  }
}