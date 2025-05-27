## Installing the required packages
FROM node:22-alpine as setup
WORKDIR /usr/src/app
COPY package.json .
COPY ./.yarn ./.yarn
COPY .yarnrc.yml .
COPY yarn.lock .
RUN yarn workspaces focus -A
COPY . .

## Building the app
FROM setup as build
RUN yarn build

## Image for Development
FROM setup as development
ENV NODE_ENV=development

## Image for Production
FROM node:22-alpine as production
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package.json .
COPY ./.yarn ./.yarn
COPY .yarnrc.yml .
COPY yarn.lock .
COPY --from=build /usr/src/app/dist ./dist
RUN yarn workspaces focus --production
CMD ["yarn", "start"]