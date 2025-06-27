# know-your-git

- Experimental utility to list up every files you modified in the github (enterprise)
- Currently, it's proof of concept.
- I implemented this within a day, so that code quality is pretty bad

## Feature

- Cache github graphql api result into file system so that you don't get blocked
- If some file path is changed, the latest one will be considered as representative path
  - For example, consider following scenario.
    1. commit `a.txt` once at first pull request
    2. change `a.txt` to `b.txt` at second pull request
  - You'll only get `b.txt` with 2 modification.

## Usage

```
touch .env
nvm use
npm i
```

Then add followings to the `.env` file

```
# change these if you want to search from enterprise
GITHUB_API_URL=https://api.github.com/graphql
GIT_DOMAIN=github.com

# credential
GITHUB_AUTH_KEY=<your github private ssh key>
PAT=<your github personal access token>
```

Note that your personal access token should have proper authority to access.

Now you can play with `npm run server`

```
npm run server > out.md
```

## Pitfall

- I haven't test this with public github
- It works fine with enterprise github
