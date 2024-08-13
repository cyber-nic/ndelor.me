---
title: "Terraform Project Structures: Organizing Infrastructure as Code"
date: 2024-08-07T10:22:09+01:00
lastmod: 2024-08-07T10:22:09+01:00
tags: ["terraform", "iac", "code"]
draft: false
---
# Table of Contents
1. Managing Security and Cost: Accounts as Environments
1. Managing Performance and Risk: Layers and Overlays
1. Managing Code: Repos. Folders, and Pipelines
    1. Dedicated Repo for Account and IaC Service Account Setup
    1. Application Specific Service Accounts
1. Managing Releases: Applications as Modules
    1. Integrated Deployment Structure
    1. Dedicated Deployment Structure
    1. Isolated Deployment Structure
1. Managing Environments: Using Terraform Workspaces vs Dedicated Folders
    1. Terraform Workspaces
    1. Dedicated Folders

# Summary
This article delves into the complexities and best practices of structuring Terraform projects, focusing on optimizing infrastructure as code for security, cost management, and performance. It discusses the benefits of using separate AWS accounts for each environment to enhance security and manage costs, and explores different strategies for managing code and deployments through layers and overlays. The article compares the use of Terraform workspaces versus dedicated folders, providing guidance on when each method is most effective based on the size and complexity of the project. Ultimately, it offers practical recommendations on setting up and maintaining scalable, secure, and efficient Terraform infrastructure, making it a valuable resource for developers and teams working with infrastructure as code.

> *Abstractions are great, but aren't always necessary: “a little copying is better than a little dependency”*

# 1. Managing Security and Cost: Accounts as Environments

> *Create an Account for each Environment*

Even if it does present overhead creating an AWS account for each environment offers better cost and security isolation. An AWS account requires a unique email address but this can be managed by using email aliases (eg. `my-email+my-dev-account-name@gmail.com`). It might even be worth creating Project or Team Accounts, also split into environments (eg. `my-dev-eng-shared-resources` vs `my-prd-eng-shared-resources` vs `my-prd-stealth-project`). Creating many accounts involves overhead, so plan accordingly.

# 2. Managing Performance and Risk: Layers and Overlays

> *Manage your IaC in well-crafted layers.*

Infrastructure as code (IaC) it can quickly become complex and involve tradeoffs and risk management when it comes to managing dependencies. Let's distinguish between Configuration Management (CM) and [Code] Deployment. To continuously detect and correct these drifts we want to run our Configuration Management layer(s) frequently. In small projects CM might be applied continuously alongside the application code deployments, but as codebases grow this can become the source of overhead (slowness) and needs to be applied separately. This is the bottom of our code release pyramid. The *blast radius* is large as mistakes can be of severe consequences.

Application code is at the top of the pyramid. Ideally, this code deploys for each commit to a branch.

The pyramid can be of variable depth. Typically I operate between 1 and 3 layers:
```
        /\
       /  \
      /app \      -> App code, runs continuously
     / code \
    /        \
   / vpc + db \   -> App-specific Base layer, runs regularly
  /            \
 / account setup\ -> Infra or Core layer, runs periodically or on-demand
/     and iam    \
```

Along with `Configuration Management` and `Application Code` when writing IaC it is necessary to factor in other dimensions such as `Code Repositories` (where should the code live?), `Environments` (dev, prd, etc) and `Pipelines` (the order in which to apply the various layers). As always the best solution depends on your project and team needs.

# 3. Managing Code: Repos. Folders, and Pipelines

> *Set conventions and stick to them.*

Here are a few ideas for organizing IaC layers.

### 3.1 Account and Pipeline Service Account Setup

> *Create a dedicated Repo with Environment-Specific Account Setup and IAM*

While this involves overhead for a small project, I highly recommend starting with this early on in a project. The idea is to isolate more sensitive IaC that is less likely to drift frequently. In this example, each account has a dedicated folder (eg. `my-dev-account-name`) along with a [bootstrap](github.com/trussworks/terraform-aws-bootstrap) folder and terraform.tfstate committed to repo. The env-specific `main.tf` then uses the bootstrapped backend to create the additional Backends necessary for the application overlays in other repos. It also creates tailor made (ie. with minimal permission policies) Service Accounts for those application overlays.

```bash
/pipelines
  ci.yaml
/accounts
  /my-dev-account-name
    main.tf
    /bootstrap
      main.tf
      terraform.tfstate
  /my-prd-account-name
    main.tf
    /bootstrap
      main.tf
      terraform.tfstate
  /modules
    /service-account
```

### 3.2 Application Specific Service Account
As for application-specific Service Accounts...

#### IAM Service Account Definition in the Same Monorepo
##### Pros
1. **Simplified Management**: Keeping everything in the same repo simplifies the process. You have a single source of truth, making it easier to manage and reference.
1. **Consistent Versioning**: The IAM service account definition will evolve alongside the Terraform code, ensuring that any changes to infrastructure requirements can be synchronized with the corresponding IAM policy updates.
1. **SEasier Onboarding**: New team members only need access to one repository to see the full context of the infrastructure and its associated IAM policies.
##### Cons
1. **Tight Coupling**: Tying the IAM service account directly to the monorepo may lead to challenges if you later need to reuse or share this IAM configuration across other projects or repos.
1. **Potential Security Risks**: With IAM policies living alongside other infrastructure code, there’s a higher risk of accidental modifications, which could lead to security issues.

**Best Use Case**: Suitable when you have a tightly coupled environment where infrastructure and IAM policies are closely linked, and where managing everything in a single place is more convenient.

#### IAM Service Account Definition in a Dedicated (Account) Repo
##### Pros
1. **Separation of Concerns**: A dedicated IAM repository keeps identity and access management separate from your infrastructure code, aligning with the principle of least privilege. This reduces the risk of accidental changes and enhances security.
1. **Scalability and Flexibility**: As your AWS environment grows, this separation allows you to manage IAM policies more flexibly, potentially sharing or reusing them across multiple projects or repos.
1. **Security Best Practices**: It’s easier to apply stricter access controls and review processes on a dedicated IAM repo, reducing the likelihood of unauthorized changes.
##### Cons
1. **Increased Complexity**: Requires managing multiple repositories, which can add complexity to your workflow, especially during setup and maintenance.
1. **Coordination Overhead**: Changes to IAM policies might need to be coordinated with updates in your Terraform infrastructure, leading to possible synchronization challenges.

**Best Use Case**: Ideal for environments that prioritize security, scalability, and flexibility, especially when the IAM service accounts might be shared or reused across different teams or projects.


## 4. Managing Releases: Applications as Modules
> Note that `Environment` and `Account` are interchangeable terms in the case of a 1:1 mapping

### 4.1 Integrated Deployment Structure
```bash
/pipelines
  my-dev-project.yaml
  my-prd-project.yaml
/iac
  /accounts
    /my-dev-project
      state.tf
      main.tf         # calls ../../modules/vpc, ../../modules/database, ../../applications/app1, ../../applications/app2
    /my-prd-project
      state.tf
      main.tf         # calls ../../modules/vpc, ../../modules/database, ../../applications/app1, ../../applications/app2
  /modules
    /vpc
    /database
  /applications
    /app1
      main.tf
      variables.tf
      outputs.tf
    /app2
      main.tf
      variables.tf
      outputs.tf
```
#### Overview
This structure keeps infrastructure and application deployment tightly coupled within the same Terraform configurations (main.tf) in each environment.

#### Pros
1. **Simplicity**: Single main.tf handles all resource deployments, making it straightforward to understand and deploy.
1. **Unified Management**: Simplifies state management as there's a single state file per environment. Changes to infrastructure and applications are applied simultaneously, ensuring consistency.

#### Cons
1. **Complex Dependency Management**: Changes to applications may require re-deployment of infrastructure or vice versa, increasing risk.
1. **Reduced Flexibility**: Harder to apply changes to one component (app vs. infra) without affecting the other.
1. **Scalability Issues**: As the project grows, the main.tf can become unwieldy, making maintenance challenging.

#### Pipeline Implications
A single pipeline per environment might handle both infra and application changes. This requires careful planning to ensure that infra changes do not unnecessarily impact application deployments.

### 4.2 Dedicated Deployment Structure
```bash
/pipelines
  # dev
  my-dev-project.yaml
  my-dev-project-apps.yaml
  # prd
  my-prd-project.yaml
  my-prd-project-apps.yaml
/iac
  /accounts
    /my-dev-project
      state.tf
      main.tf         # calls ../../modules/vpc, ../../modules/database
      /apps
        main.tf       # calls ../../applications/app1, ../../applications/app2
    /my-prd-project
      state.tf
      main.tf         # calls ../../modules/vpc, ../../modules/database
      /apps
        main.tf       # calls ../../applications/app1, ../../applications/app2
  /modules
    ...
  /applications
    ...
```
#### Overview
Infrastructure and applications are separated at the top level, but applications are still grouped under a single main.tf within /apps for each environment.

#### Pros
1. **Better Isolation**: Infrastructure code is separated from application code, reducing the risk of unintended side effects when deploying applications.
1. **Modularity**: Allows for independent updates of infrastructure while having a slightly coupled application setup.

#### Cons
1. **Moderate Complexity**: While infra is isolated, applications still share a common deployment pipeline which could lead to issues if one application needs changes not applicable to others.
1. **Dependency Management**: Still requires coordination between the infra and app deployments but less so than the Integrated structure.

#### Pipeline Implications
Could use separate pipelines for infra and apps or a single pipeline that manages dependencies internally. This offers flexibility but requires more sophisticated CI/CD logic to handle the partial coupling of applications.

### 4.3 Isolated Deployment Structure
```bash
/pipelines
  # dev
  my-dev-project.yaml
  my-dev-project-app1.yaml
  my-dev-project-app2.yaml
  # prd
  my-prd-project.yaml
  my-prd-project-app1.yaml
  my-prd-project-app2.yaml
/iac
  /accounts
    /my-dev-project
      state.tf
      main.tf         # calls ../../modules/vpc, ../../modules/database
      /apps
        /app1
          main.tf     # calls ../../applications/app1
        /app2
          main.tf     # calls ../../applications/app2
    /my-prd-project
      state.tf
      main.tf
      /apps
        /app1
          main.tf     # calls ../../applications/app1
        /app2
          main.tf     # calls ../../applications/app2
  /modules
    ...
  /applications
    ...
```
#### Overview
Each application has its own directory under /apps, and calls to specific applications are made individually, providing the highest level of isolation.

#### Pros
- **High Isolation**: Each application can be deployed independently, reducing the deployment risks associated with shared resources.
- **Flexibility**: Easier to manage different lifecycle stages for each application, such as different scaling needs or upgrade paths.
- **Granular Control**: Changes to one application do not affect others, and rollbacks can be handled per application.

#### Cons
- **Increased Management Overhead**: More complex directory structure and possibly more state files to manage.
- **Potential Redundancy**: Some effort may be duplicated across applications, such as similar CI/CD steps for each app.

#### Pipeline Implications
Each application likely has its own pipeline, which increases the number of pipelines but provides maximum control over deployment and versioning. Requires robust orchestration to manage multiple pipelines efficiently.

### Conclusion
Choosing between these structures depends on the organization's operational complexity, the interdependencies of applications and infrastructure, and the team's capacity to manage multiple pipelines.

- For smaller projects or those with tightly coupled infra and apps, the **Integrated Deployment Structure** may be simplest.
- For larger teams requiring better separation without full isolation, the **Dedicated Deployment Structure** provides a balanced approach.
- For enterprises with complex environments where applications need to operate independently, the **Isolated Deployment Structure** offers the best control and reduces cross-application risks.

And of course, there are many hybrid approaches to consider...

# 5. Managing Environments: Using Terraform Workspaces vs Dedicated Folders
Here are pros and cons of using Terraform workspaces versus dedicated folders for deploying to different environments (e.g., dev, tst, prd).

### 5.1 Terraform Workspaces

#### Pros
1. **Single Codebase**: All environments share a single set of Terraform configuration files, reducing code duplication and making it easier to maintain consistency across environments.
1. **Simplified Management**: Workspaces allow you to switch between environments easily within the same directory, simplifying workflows for deploying infrastructure to different environments.
1. **Reduced Repository Complexity**: Since all environments are managed in the same directory, your repository remains simpler with fewer directories or files to manage.
1. **State Isolation**: Each workspace has its own state file, ensuring that changes in one environment don't affect another.

#### Cons
1. **Limited Environment Customization**: Customizing configurations for each environment (e.g., different resource counts, instance types) can become challenging, as you have to rely on conditionals and variable management within the same set of files.
1. **Potential for Mistakes**: The risk of accidentally applying changes to the wrong environment increases, especially if developers are not careful when switching workspaces.
1. **Poor Scalability for Complex Infrastructures**: For complex projects with significantly different environments, managing everything in a single directory with workspaces can become unwieldy.
1. **Dependency Management**: Managing dependencies between resources across environments (e.g., shared services or resources) can be cumbersome with workspaces, as they don’t naturally support cross-environment resource sharing.

#### Best Use Case
1. **Small to Medium Projects**: If your environments are very similar and you have a relatively simple infrastructure, workspaces can be a good choice. They simplify management and reduce code duplication, making them well-suited for small to medium-sized projects.
1. **Consistent Infrastructure:** If the environments do not require significant customization and the main differences can be managed through variables, workspaces offer an efficient way to handle deployments.

### 5.2 Dedicated Folders
#### Pros
1. **Clear Environment Separation**: Each environment has its own folder with separate Terraform configurations, making it easier to manage and customize infrastructure per environment.
1. **Environment-Specific Customization**: You can tailor each environment's infrastructure independently, without needing to add complex conditionals or logic to a single set of configurations.
1. **Better Scalability**: As the infrastructure grows in complexity, dedicated folders offer better scalability, allowing you to manage environments independently without cluttering a single directory.
1. **Reduced Risk of Mistakes**: Since environments are separated by directories, the risk of accidentally deploying changes to the wrong environment is minimized.
1. **Easier Cross-Environment Dependencies**: Dedicated folders can more easily handle cross-environment dependencies by referencing shared modules or remote state files.

#### Cons
1. **Code Duplication**: There may be some duplication of code across environment directories, which can lead to inconsistencies if not carefully managed.
1. **Higher Maintenance Overhead**: Managing multiple folders requires more effort in keeping configurations consistent and synchronized across environments.
1. **Repository Complexity**: More folders and files can lead to a more complex repository structure, making it harder to navigate, especially for new team members.

#### Best Use Case
1. **Large or Complex Projects:** For large, complex projects where each environment might have different configurations, dedicated folders provide better scalability and clearer separation of concerns.
Highly Customized Environments: If each environment requires distinct configurations or if your infrastructure needs to scale significantly, dedicated folders offer more flexibility and easier management of cross-environment dependencies.
1. **Multi-Account Strategies:** If you are employing a multi-account strategy (e.g., different AWS accounts for dev, staging, and production), dedicated folders align better with the need for distinct environments that are isolated not just logically, but also physically across accounts.
