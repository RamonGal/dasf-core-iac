import { EcrRepo } from "./ecr-repo";

const ecrRepo = new EcrRepo("dasf-eks-ecr-repo");
const ecrRepoUrl = ecrRepo.repositoryUrl;

export { ecrRepoUrl };
