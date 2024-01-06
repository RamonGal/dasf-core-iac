import { ecrRepoUrl } from "./ecr";
import {
  createArgoDasfFramework, 
} from "./cluster-components";

const framework = createArgoDasfFramework(); 
const argoServiceName = framework.argoOperator.fullname;
const daskServiceAccountName = framework.daskServiceAccount.saName; 

export {  ecrRepoUrl, argoServiceName, daskServiceAccountName };
