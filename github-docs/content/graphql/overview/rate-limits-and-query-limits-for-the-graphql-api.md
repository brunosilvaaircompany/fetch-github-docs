# Rate limits and query limits for the GraphQL API

## Primary rate limit



Rate limits are disabled by default for GitHub Enterprise Server. Contact your site administrator to confirm the rate limits for your instance.

If you are a site administrator, you can set rate limits for your instance. For more information, see [Configuring Rate Limits](https://docs.github.com/en/admin/configuring-settings/configuring-user-applications-for-your-enterprise/configuring-rate-limits).

If you are developing an app for users or organizations outside of your instance, the standard GitHub rate limits apply. For more information, see [Rate Limits And Query Limits For The GraphQL API](https://docs.github.com/en/free-pro-team@latest/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) in the GitHub Free documentation.



## Node limit

To pass [schema](/graphql/guides/introduction-to-graphql#schema) validation, all GraphQL API [calls](/graphql/guides/forming-calls-with-graphql) must meet these standards:

* Clients must supply a `first` or `last` argument on any [connection](/graphql/guides/introduction-to-graphql#connection).
* Values of `first` and `last` must be within 1-100.
* Individual calls cannot request more than 500,000 total [nodes](/graphql/guides/introduction-to-graphql#node).

### Calculating nodes in a call

These two examples show how to calculate the total nodes in a call.

1. Simple query:

   <pre>query {
     viewer {
       repositories(first: <span class="redbox">50</span>) {
         edges {
           repository:node {
             name

             issues(first: <span class="greenbox">10</span>) {
               totalCount
               edges {
                 node {
                   title
                   bodyHTML
                 }
               }
             }
           }
         }
       }
     }
   }</pre>

   Calculation:

   <pre><span class="redbox">50</span>         = 50 repositories
    +
   <span class="redbox">50</span> x <span class="greenbox">10</span>  = 500 repository issues

               = 550 total nodes</pre>

1. Complex query:

   <pre>query {
     viewer {
       repositories(first: <span class="redbox">50</span>) {
         edges {
           repository:node {
             name

             pullRequests(first: <span class="greenbox">20</span>) {
               edges {
                 pullRequest:node {
                   title

                   comments(first: <span class="bluebox">10</span>) {
                     edges {
                       comment:node {
                         bodyHTML
                       }
                     }
                   }
                 }
               }
             }

             issues(first: <span class="greenbox">20</span>) {
               totalCount
               edges {
                 issue:node {
                   title
                   bodyHTML

                   comments(first: <span class="bluebox">10</span>) {
                     edges {
                       comment:node {
                         bodyHTML
                       }
                     }
                   }
                 }
               }
             }
           }
         }
       }

       followers(first: <span class="bluebox">10</span>) {
         edges {
           follower:node {
             login
           }
         }
       }
     }
   }</code></pre>

   Calculation:

   <pre><span class="redbox">50</span>              = 50 repositories
    +
   <span class="redbox">50</span> x <span class="greenbox">20</span>       = 1,000 pullRequests
    +
   <span class="redbox">50</span> x <span class="greenbox">20</span> x <span class="bluebox">10</span> = 10,000 pullRequest comments
    +
   <span class="redbox">50</span> x <span class="greenbox">20</span>       = 1,000 issues
    +
   <span class="redbox">50</span> x <span class="greenbox">20</span> x <span class="bluebox">10</span> = 10,000 issue comments
    +
   <span class="bluebox">10</span>              = 10 followers

                    = 22,060 total nodes</pre>

  

## Timeouts

If GitHub takes more than 10 seconds to process an API request, GitHub will terminate the request and you will receive a timeout response and a message reporting that "We couldn't respond to your request in time".

When this happens, you may receive either a `502` or `504` status code. Both status codes indicate that your request timed out.

GitHub reserves the right to change the timeout window to protect the speed and reliability of the API.

You can check the status of the GraphQL API at [githubstatus.com](https://www.githubstatus.com/) to determine whether the timeout is due to a problem with the API. You can also try to simplify your request or try your request later. For tips on improving query performance, see [Query optimization strategies](#query-optimization-strategies).

If a timeout occurs for any of your API requests, additional points will be deducted from your primary rate limit for the next hour to protect the speed and reliability of the API.

## Other resource limits

To protect the speed and reliability of the API, GitHub also enforces other resource limitations. If your GraphQL query consumes too many resources, GitHub will terminate the request and return partial results along with an error indicating that resource limits were exceeded.

**Examples of queries that may exceed resource limits:**

* Requesting thousands of objects or deeply nested relationships in a single query.
* Using large `first` or `last` arguments in multiple connections simultaneously.
* Fetching extensive details for each object, such as all comments, reactions, and related issues for every repository.



## Query optimization strategies

* **Limit the number of objects**: Use smaller values for `first` or `last` arguments and paginate through results.
* **Reduce query depth**: Avoid requesting deeply nested objects unless necessary.
* **Filter results**: Use arguments to filter data and return only what you need.
* **Split large queries**: Break up complex queries into multiple simpler queries.
* **Request only required fields**: Select only the fields you need, rather than requesting all available fields.

By following these strategies, you can reduce the likelihood of hitting resource limits and improve the performance and reliability of your API requests.
