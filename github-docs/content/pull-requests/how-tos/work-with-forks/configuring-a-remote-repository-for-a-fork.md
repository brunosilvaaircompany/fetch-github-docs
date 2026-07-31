# Configuring a remote repository for a fork

1. Open your terminal or Git Bash.
1. List the remotes currently configured for your fork.

   ```shell
   $ git remote -v
   > origin  https://{% data variables.product.product_url %}/YOUR-USERNAME/YOUR-FORK.git (fetch)
   > origin  https://{% data variables.product.product_url %}/YOUR-USERNAME/YOUR-FORK.git (push)
   ```

1. Add a new remote named _upstream_ that points to the original repository.

   ```shell
   git remote add upstream https://{% data variables.product.product_url %}/ORIGINAL-OWNER/ORIGINAL-REPOSITORY.git
   ```

1. Verify the new upstream repository that you specified for your fork.

   ```shell
   $ git remote -v
   > origin    https://{% data variables.product.product_url %}/YOUR-USERNAME/YOUR-FORK.git (fetch)
   > origin    https://{% data variables.product.product_url %}/YOUR-USERNAME/YOUR-FORK.git (push)
   > upstream  https://{% data variables.product.product_url %}/ORIGINAL-OWNER/ORIGINAL-REPOSITORY.git (fetch)
   > upstream  https://{% data variables.product.product_url %}/ORIGINAL-OWNER/ORIGINAL-REPOSITORY.git (push)
   ```
