import { EcrRepo } from "./ecr-repo";

const ecrRepo = new EcrRepo("iac-eks-ecr-repo");
const ecrRepoUrl = ecrRepo.repositoryUrl;

export { ecrRepoUrl };
