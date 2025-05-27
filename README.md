# Retex API

Retex API is a scaffolding for creating a new edge application using [NestJS](https://nestjs.com/).

## Libraries

In this project, we use the following libraries:

- [NestJS](https://nestjs.com/)
- [Typescript](https://www.typescriptlang.org/)
- [Jest](https://jestjs.io/)
- [Prettier](https://prettier.io/)
- [Eslint](https://eslint.org/)
- [Husky](https://typicode.github.io/husky/#/)
- [CommitLint](https://commitlint.js.org/#/)
- [Docker](https://www.docker.com/)
- [TypeOrm](https://typeorm.io/)
- [Pino](https://getpino.io/#/)

## Configuration

The project requires a configuration file called `.env` to be present in the root of the project. This file contains the variables used in the project. To create a standard configuration file,
you can just copy the `.env.example` file and rename it to `.env`.

### Migrations

To create new migrations for the application, run the following command:

```bash
yarn typeorm:migrate <NAME_OF_MIGRATION>
```

and to run them all, run the following command:

```bash
yarn typeorm:run
```

## How to run

To execute de project you need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your machine.
You can run the project using the following command:

```bash
docker-compose up
```

Once the project is running, you can access it at the port configurated in the `.env` file (default `3000`). By default the project contains the following endpoints:

- (GET) `/`: Home page
- (POST) `/user`: Create a new user
- (GET) `/user/:id`: Get a user by id

The implementation of these endpoints is only a stub, you can change/delete it to fit your needs.
