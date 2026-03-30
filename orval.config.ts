openapi: 3.1.0
info:
  title: Api
  version: 0.1.0
  description: Sports League Management Platform API
servers:
  - url: /api
    description: Base API path
tags:
  - name: health
    description: Health operations
  - name: auth
    description: Authentication
  - name: games
    description: Sports/Games management
  - name: players
    description: Player management
  - name: franchises
    description: Franchise management
  - name: auctions
    description: Auction and bidding
  - name: matches
    description: Match scheduling and live tracking
  - name: fouls
    description: Fouls and discipline
  - name: recommendations
    description: AI player recommendations

paths:
  /healthz:
    get:
      operationId: healthCheck
      tags: [health]
      summary: Health check
      responses:
        "200":
          description: Healthy
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/HealthStatus"

  /auth/me:
    get:
      operationId: getMe
      tags: [auth]
      summary: Get current user
      responses:
        "200":
          description: Current user
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "401":
          description: Unauthorized

  /auth/login:
    post:
      operationId: login
      tags: [auth]
      summary: Login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LoginRequest"
      responses:
        "200":
          description: Login successful
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"
        "401":
          description: Invalid credentials

  /auth/register:
    post:
      operationId: register
      tags: [auth]
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RegisterRequest"
      responses:
        "201":
          description: Registered successfully
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"

  /auth/logout:
    post:
      operationId: logout
      tags: [auth]
      summary: Logout
      responses:
        "200":
          description: Logged out

  /games:
    get:
      operationId: listGames
      tags: [games]
      summary: List all games/sports
      responses:
        "200":
          description: List of games
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Game"
    post:
      operationId: createGame
      tags: [games]
      summary: Create a new game/sport (Admin only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateGameRequest"
      responses:
        "201":
          description: Game created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Game"

  /games/{gameId}:
    get:
      operationId: getGame
      tags: [games]
      summary: Get game details
      parameters:
        - name: gameId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Game details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Game"
    put:
      operationId: updateGame
      tags: [games]
      summary: Update game (Admin only)
      parameters:
        - name: gameId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateGameRequest"
      responses:
        "200":
          description: Game updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Game"

  /games/{gameId}/enroll:
    post:
      operationId: enrollInGame
      tags: [games]
      summary: Player enrolls in a game
      parameters:
        - name: gameId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/EnrollRequest"
      responses:
        "201":
          description: Enrolled successfully

  /players:
    get:
      operationId: listPlayers
      tags: [players]
      summary: List all players
      parameters:
        - name: gameId
          in: query
          schema:
            type: integer
        - name: available
          in: query
          schema:
            type: boolean
      responses:
        "200":
          description: List of players
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/PlayerProfile"

  /players/{playerId}:
    get:
      operationId: getPlayer
      tags: [players]
      summary: Get player profile
      parameters:
        - name: playerId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Player profile
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PlayerProfile"
    put:
      operationId: updatePlayer
      tags: [players]
      summary: Update player profile
      parameters:
        - name: playerId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdatePlayerRequest"
      responses:
        "200":
          description: Player updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/PlayerProfile"

  /players/{playerId}/ban:
    post:
      operationId: banPlayer
      tags: [players]
      summary: Ban a player (Admin only)
      parameters:
        - name: playerId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/BanRequest"
      responses:
        "200":
          description: Player banned

  /franchises:
    get:
      operationId: listFranchises
      tags: [franchises]
      summary: List all franchises
      parameters:
        - name: gameId
          in: query
          schema:
            type: integer
      responses:
        "200":
          description: List of franchises
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Franchise"
    post:
      operationId: createFranchise
      tags: [franchises]
      summary: Create a franchise (Admin only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateFranchiseRequest"
      responses:
        "201":
          description: Franchise created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Franchise"

  /franchises/{franchiseId}:
    get:
      operationId: getFranchise
      tags: [franchises]
      summary: Get franchise details
      parameters:
        - name: franchiseId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Franchise details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Franchise"

  /franchises/{franchiseId}/players:
    get:
      operationId: getFranchisePlayers
      tags: [franchises]
      summary: Get players in a franchise
      parameters:
        - name: franchiseId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Franchise players
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/PlayerProfile"
    post:
      operationId: addPlayerToFranchise
      tags: [franchises]
      summary: Add player directly to franchise (Admin only)
      parameters:
        - name: franchiseId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/AddPlayerRequest"
      responses:
        "201":
          description: Player added

  /franchises/{franchiseId}/players/{playerId}:
    delete:
      operationId: removePlayerFromFranchise
      tags: [franchises]
      summary: Remove player from franchise
      parameters:
        - name: franchiseId
          in: path
          required: true
          schema:
            type: integer
        - name: playerId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Player removed

  /auctions:
    get:
      operationId: listAuctions
      tags: [auctions]
      summary: List auctions
      parameters:
        - name: gameId
          in: query
          schema:
            type: integer
      responses:
        "200":
          description: List of auctions
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Auction"
    post:
      operationId: createAuction
      tags: [auctions]
      summary: Create an auction (Admin only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateAuctionRequest"
      responses:
        "201":
          description: Auction created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Auction"

  /auctions/{auctionId}:
    get:
      operationId: getAuction
      tags: [auctions]
      summary: Get auction details
      parameters:
        - name: auctionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Auction details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Auction"

  /auctions/{auctionId}/start:
    post:
      operationId: startAuction
      tags: [auctions]
      summary: Start auction (Admin only)
      parameters:
        - name: auctionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Auction started
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Auction"

  /auctions/{auctionId}/close:
    post:
      operationId: closeAuction
      tags: [auctions]
      summary: Close auction and assign players (Admin only)
      parameters:
        - name: auctionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Auction closed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Auction"

  /auctions/{auctionId}/bids:
    get:
      operationId: listBids
      tags: [auctions]
      summary: List bids for auction
      parameters:
        - name: auctionId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: List of bids
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Bid"
    post:
      operationId: placeBid
      tags: [auctions]
      summary: Place a bid (Franchise owner)
      parameters:
        - name: auctionId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PlaceBidRequest"
      responses:
        "201":
          description: Bid placed
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Bid"

  /matches:
    get:
      operationId: listMatches
      tags: [matches]
      summary: List matches
      parameters:
        - name: gameId
          in: query
          schema:
            type: integer
        - name: status
          in: query
          schema:
            type: string
            enum: [scheduled, live, completed]
      responses:
        "200":
          description: List of matches
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Match"
    post:
      operationId: createMatch
      tags: [matches]
      summary: Create a match (Admin only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateMatchRequest"
      responses:
        "201":
          description: Match created
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Match"

  /matches/{matchId}:
    get:
      operationId: getMatch
      tags: [matches]
      summary: Get match details
      parameters:
        - name: matchId
          in: path
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Match details
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Match"
    put:
      operationId: updateMatch
      tags: [matches]
      summary: Update match result (Admin only)
      parameters:
        - name: matchId
          in: path
          required: true
          schema:
            type: integer
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UpdateMatchRequest"
      responses:
        "200":
          description: Match updated
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Match"

  /fouls:
    get:
      operationId: listFouls
      tags: [fouls]
      summary: List fouls
      parameters:
        - name: playerId
          in: query
          schema:
            type: integer
      responses:
        "200":
          description: List of fouls
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Foul"
    post:
      operationId: addFoul
      tags: [fouls]
      summary: Add a foul to a player (Admin only)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/CreateFoulRequest"
      responses:
        "201":
          description: Foul added
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Foul"

  /recommendations:
    get:
      operationId: getRecommendations
      tags: [recommendations]
      summary: Get AI player recommendations for a franchise
      parameters:
        - name: franchiseId
          in: query
          required: true
          schema:
            type: integer
        - name: gameId
          in: query
          required: true
          schema:
            type: integer
        - name: maxBudget
          in: query
          schema:
            type: number
      responses:
        "200":
          description: Player recommendations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/PlayerRecommendation"

  /leaderboard:
    get:
      operationId: getLeaderboard
      tags: [matches]
      summary: Get leaderboard for a game
      parameters:
        - name: gameId
          in: query
          required: true
          schema:
            type: integer
      responses:
        "200":
          description: Leaderboard
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/LeaderboardEntry"

  /admin/stats:
    get:
      operationId: getAdminStats
      tags: [games]
      summary: Get overall platform stats (Admin only)
      responses:
        "200":
          description: Platform stats
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AdminStats"

components:
  schemas:
    HealthStatus:
      type: object
      properties:
        status:
          type: string
      required:
        - status

    User:
      type: object
      properties:
        id:
          type: integer
        username:
          type: string
        email:
          type: string
        role:
          type: string
          enum: [admin, franchise_owner, player]
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - username
        - email
        - role
        - createdAt

    LoginRequest:
      type: object
      properties:
        email:
          type: string
        password:
          type: string
      required:
        - email
        - password

    RegisterRequest:
      type: object
      properties:
        name:
          type: string
        username:
          type: string
        email:
          type: string
        password:
          type: string
        role:
          type: string
          enum: [franchise_owner, player, admin]
      required:
        - name
        - username
        - email
        - password
        - role

    AuthResponse:
      type: object
      properties:
        user:
          $ref: "#/components/schemas/User"
        token:
          type: string
      required:
        - user
        - token

    Game:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        description:
          type: string
        rules:
          type: string
        maxTeamSize:
          type: integer
        minTeamSize:
          type: integer
        auctionBudget:
          type: number
        status:
          type: string
          enum: [active, inactive]
        playerCount:
          type: integer
        franchiseCount:
          type: integer
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - maxTeamSize
        - minTeamSize
        - auctionBudget
        - status
        - createdAt

    CreateGameRequest:
      type: object
      properties:
        name:
          type: string
        description:
          type: string
        rules:
          type: string
        maxTeamSize:
          type: integer
        minTeamSize:
          type: integer
        auctionBudget:
          type: number
        status:
          type: string
          enum: [active, inactive]
      required:
        - name
        - maxTeamSize
        - minTeamSize
        - auctionBudget

    EnrollRequest:
      type: object
      properties:
        skillRating:
          type: number
          minimum: 0
          maximum: 10
        position:
          type: string
      required:
        - skillRating

    PlayerProfile:
      type: object
      properties:
        id:
          type: integer
        userId:
          type: integer
        username:
          type: string
        email:
          type: string
        skillRating:
          type: number
        performanceScore:
          type: number
        disciplineScore:
          type: number
        overallScore:
          type: number
        position:
          type: string
        isBanned:
          type: boolean
        franchiseId:
          type: integer
        franchiseName:
          type: string
        gameId:
          type: integer
        gameName:
          type: string
        foulCount:
          type: integer
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - userId
        - username
        - skillRating
        - performanceScore
        - disciplineScore
        - overallScore
        - isBanned
        - foulCount
        - createdAt

    UpdatePlayerRequest:
      type: object
      properties:
        skillRating:
          type: number
        position:
          type: string
        performanceScore:
          type: number

    BanRequest:
      type: object
      properties:
        reason:
          type: string
      required:
        - reason

    Franchise:
      type: object
      properties:
        id:
          type: integer
        name:
          type: string
        ownerId:
          type: integer
        ownerName:
          type: string
        gameId:
          type: integer
        gameName:
          type: string
        totalBudget:
          type: number
        remainingBudget:
          type: number
        maxPlayers:
          type: integer
        playerCount:
          type: integer
        wins:
          type: integer
        losses:
          type: integer
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - name
        - ownerId
        - gameId
        - totalBudget
        - remainingBudget
        - maxPlayers
        - playerCount
        - wins
        - losses
        - createdAt

    CreateFranchiseRequest:
      type: object
      properties:
        name:
          type: string
        ownerId:
          type: integer
        gameId:
          type: integer
        totalBudget:
          type: number
        maxPlayers:
          type: integer
      required:
        - name
        - ownerId
        - gameId
        - totalBudget
        - maxPlayers

    AddPlayerRequest:
      type: object
      properties:
        playerId:
          type: integer
      required:
        - playerId

    Auction:
      type: object
      properties:
        id:
          type: integer
        gameId:
          type: integer
        gameName:
          type: string
        status:
          type: string
          enum: [pending, open, closed]
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        playerCount:
          type: integer
        bidCount:
          type: integer
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - gameId
        - status
        - createdAt

    CreateAuctionRequest:
      type: object
      properties:
        gameId:
          type: integer
        endTime:
          type: string
          format: date-time
      required:
        - gameId
        - endTime

    Bid:
      type: object
      properties:
        id:
          type: integer
        auctionId:
          type: integer
        franchiseId:
          type: integer
        franchiseName:
          type: string
        playerId:
          type: integer
        playerName:
          type: string
        amount:
          type: number
        status:
          type: string
          enum: [pending, won, lost]
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - auctionId
        - franchiseId
        - playerId
        - amount
        - status
        - createdAt

    PlaceBidRequest:
      type: object
      properties:
        franchiseId:
          type: integer
        playerId:
          type: integer
        amount:
          type: number
      required:
        - franchiseId
        - playerId
        - amount

    Match:
      type: object
      properties:
        id:
          type: integer
        gameId:
          type: integer
        gameName:
          type: string
        homeTeamId:
          type: integer
        homeTeamName:
          type: string
        awayTeamId:
          type: integer
        awayTeamName:
          type: string
        homeScore:
          type: integer
        awayScore:
          type: integer
        status:
          type: string
          enum: [scheduled, live, completed]
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        venue:
          type: string
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - gameId
        - homeTeamId
        - awayTeamId
        - status
        - startTime
        - createdAt

    CreateMatchRequest:
      type: object
      properties:
        gameId:
          type: integer
        homeTeamId:
          type: integer
        awayTeamId:
          type: integer
        startTime:
          type: string
          format: date-time
        endTime:
          type: string
          format: date-time
        venue:
          type: string
      required:
        - gameId
        - homeTeamId
        - awayTeamId
        - startTime

    UpdateMatchRequest:
      type: object
      properties:
        homeScore:
          type: integer
        awayScore:
          type: integer
        status:
          type: string
          enum: [scheduled, live, completed]
        endTime:
          type: string
          format: date-time
        venue:
          type: string

    Foul:
      type: object
      properties:
        id:
          type: integer
        playerId:
          type: integer
        playerName:
          type: string
        type:
          type: string
          enum: [minor, major]
        reason:
          type: string
        penaltyPoints:
          type: integer
        createdAt:
          type: string
          format: date-time
      required:
        - id
        - playerId
        - type
        - reason
        - penaltyPoints
        - createdAt

    CreateFoulRequest:
      type: object
      properties:
        playerId:
          type: integer
        type:
          type: string
          enum: [minor, major]
        reason:
          type: string
      required:
        - playerId
        - type
        - reason

    PlayerRecommendation:
      type: object
      properties:
        player:
          $ref: "#/components/schemas/PlayerProfile"
        score:
          type: number
        valueScore:
          type: number
        reason:
          type: string
        suggestedBid:
          type: number
      required:
        - player
        - score
        - valueScore
        - reason
        - suggestedBid

    LeaderboardEntry:
      type: object
      properties:
        rank:
          type: integer
        franchiseId:
          type: integer
        franchiseName:
          type: string
        wins:
          type: integer
        losses:
          type: integer
        points:
          type: integer
        matchesPlayed:
          type: integer
      required:
        - rank
        - franchiseId
        - franchiseName
        - wins
        - losses
        - points
        - matchesPlayed

    AdminStats:
      type: object
      properties:
        totalGames:
          type: integer
        totalPlayers:
          type: integer
        totalFranchises:
          type: integer
        totalMatches:
          type: integer
        liveMatches:
          type: integer
        activeAuctions:
          type: integer
      required:
        - totalGames
        - totalPlayers
        - totalFranchises
        - totalMatches
        - liveMatches
        - activeAuctions
