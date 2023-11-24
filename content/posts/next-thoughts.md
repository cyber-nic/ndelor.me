---
title: "Next Thoughts"
date: 2023-11-23T16:03:34Z
lastmod: 2023-11-23T16:03:34Z
tags: ["nextjs"]
draft: false
---

In 2022, I launched www.4ks.io, a recipe editing and forking website. I used React and ViteJS v2 for the front-end and was really impressed with its performance, particularly its quick Time to Interactive (TTI) metrics.

Recently, I began exploring NextJS, initially with version 13 and then upgrading to Next 14, to integrate server-side rendering (SSR) for better SEO and providing better i18n tooling. The performance with NextJS was on par with ViteJS, but I ran into some challenges, such as duplicate API calls during SSR. I utilized openapi-typescript-codegen for API swagger definition and highly recommended tRPC based a very positive experience.

Despite the overall satisfaction, I expressed reservations about NextJS's built-in API, feeling it tries to do too much by combining API functionalities with client code and SSR. I also found Auth0/Next tooling well-designed but somewhat restrictive in client-side session token retrieval. Eventually, I adapted to NextJS's approach, where data interactions pass through a client API (BFF) before reaching the main API.

The solutions below describe attempts at enabling client-side routing for a given route and subroutes. Specifically, paths `/recipe/:id` and `/recipe/id:/*` should serve the same layout with only a portion of the page replaced. The goal is to no rerender the layout and avoid unecessary API calls. This turned out to be harder then expected.

Consider this page [Pâté au Poulet Campagnard](https://www.4ks.io/recipe/0j8MYMJBGhUirs6sFDPT-pate-au-poulet-campagnard)) with the following layout (image collapsed):

![next-thoughts](/images/next-thoughts-layout.png)

# Layouts, Templates, Pages

In my initial attempt to create a more single-page application (SPA)-like experience with NextJS, I planned to use the layout component to outline the recipe page and allow the Next App router to handle the rendering of different tabs. However, a significant challenge arose: the layout components don't receive pathname as props. A suggested solution involved using [middleware](https://github.com/vercel/next.js/issues/43704#issuecomment-1411186664) to add the missing data to the NextJS request. But this approach was far from ideal. Not only is it discouraged by the NextJS team ([#57762](https://github.com/vercel/next.js/issues/57762)), but it also comes with substantial tradeoffs. For instance, using middleware interferes with the [client-side caching of rendered server components](https://github.com/vercel/next.js/issues/43704#issuecomment-1455214392), a key feature of the layout component.

Realizing this, I considered using the template component instead, which appeared to be designed differently in terms of caching. However, like the layout, the template component also doesn't receive pathname information.

This experience highlighted a potential area for improvement in NextJS, making it more flexible and less opinionated. Ultimately, I decided to explore alternative approaches, moving beyond the constraints I encountered with the layout and template components.

# Rewrites

The following idea came from [Building a single-page application with Next.js and React Router](https://colinhacks.com/essays/building-a-spa-with-nextjs). Using NextJS rewrites in `next.config`:

```javascript
async rewrites() {
  return [
    {
      source: '/recipe/:id/(forks|media|settings|versions)',
      destination: '/recipe/:id',
    },
  ];
},
```

As part of my experiment with NextJS, I implemented a block in next.config to render the `recipe/page.js` file for all specified paths, while other paths would result in a 404 error. This setup required the construction of client-side routing. Given my limited needs, I decided to build a simple component-based router instead of adding react-router-dom as a dependency.

Initially, I was quite satisfied with this approach. The local development experience, particularly with Hot Module Replacement (HMR), was smooth and efficient. It allowed for only the changed parts of the page to be re-rendered, which was exactly what I was aiming for. However, this pleasing experience in the development environment did not translate to the production build. In production, navigating between pages resulted in full page reloads, contrary to the partial re-rendering I experienced during development. This discrepancy led to the realization that this strategy did not offer any real advantage in a production environment, as it failed to maintain the SPA-like behavior I had achieved in development.

# Broken Spirit

Ultimately, I decided to stop pursuing a solution for client-side rendering of tab changes and adopted the standard NextJS approach. The final performance of the website is satisfactory, roughly equivalent to my initial ViteJS front-end. One significant advantage I noticed with this approach is the clarity of code. Following the documentation's guidance made implementation straightforward.

However, this approach is not without its drawbacks. Notably, it results in additional API calls when navigating between tabs, which could be mitigated if the layout could be cached on the client side.

# Conclusion

In conclusion, while the final product turned out great, there's a sense of disappointment in not being able to achieve the specific functionality I wanted. I enjoy working with NextJS, but it comes with trade-offs. The framework is well-thought-out and functions effectively, but its rigidity can be limiting. For example, NextJS seems to favor the Backend-For-Frontend (BFF) pattern, but I would have preferred to use my existing API written in Go. The ability to support client-side API calls directly would have been ideal. The necessity to conform to the BFF pattern is a part of NextJS that I find less appealing.

# Additional Notes

## Environment Variables

The auth0/nextjs-auth0 lib is really great. I did find confusing that `NEXT_PUBLIC_AUTH0_PROFILE` is in fact a build-time variable while `NEXT_PUBLIC_AUTH0_LOGIN` was consumed either at buildtime or runtime. NextJS documentation is clear that `NEXT_PUBLIC_` variables are buildtime.

# Resources

- NextJS App Router + tRPC: [solaldunckel/next-13-app-router-with-trpc](https://github.com/solaldunckel/next-13-app-router-with-trpc) as an example.
- NextJS + Material-UI: https://github.com/mui/material-ui/tree/master/examples/material-ui-nextjs-ts
- NextJS + Auth0: https://github.com/auth0/nextjs-auth0/blob/main/EXAMPLES.md
