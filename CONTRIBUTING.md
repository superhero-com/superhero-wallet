# Contributing & Guidelines

In 🦸 Superhero Wallet we use [git-flow](https://danielkummer.github.io/git-flow-cheatsheet/) (you can check [this git-flow breakdown](https://gist.github.com/JamesMGreene/cdd0ac49f90c987e45ac) as well to familiarize yourself with the workflow). To contribute, please follow these rules:

* A `develop` branch is created from `master`
* A `release` branch is created from `develop`
* Feature branches are created from `develop` and are prefixed with `feature/` (ex. `feature/show-token-balance`)
* If there are conflicts and the newly created feature branch needs to be synced with `develop` - rebase your branch with `develop`, resolve any conflicts that may arise and push your changes to the remote branch.
* When development is finished a pull request to `develop` is created. At least one person has to review the PR and when everything is fine the PR gets merged.
* When a feature is complete it is merged into the `develop` branch
* The `develop` branch and all the feature branches are deployed to the stage environment or feature preview environment by travis-ci automatically.
* To make a new release create a release branch called release/vX.X.X, also bump the version number in package.json in this branch.
* Create a PR to `master` which then also has to be accepted.
* Create a `tag` for this version and push the `tag`.
* Also merge back the changes (like the version bump) into `develop`.
* The `master` branch has to be deployed to the production environment manually or via the automated deployment in travis-ci.
* If an issue in master is detected a hotfix branch is created from `master`
* Once the hotfix is complete it is merged to both `develop` and `master`


All contributions are welcome :pray:
