package main

import (
	"log"

	"github.com/abhilashdk2016/golang-nextjs-chat-app/db"
	"github.com/abhilashdk2016/golang-nextjs-chat-app/internal/user"
	"github.com/abhilashdk2016/golang-nextjs-chat-app/internal/ws"
	"github.com/abhilashdk2016/golang-nextjs-chat-app/router"
)

func main() {
	dbConn, err := db.NewDatabase()
	if err != nil {
		log.Fatal("could not initialize database connection")
	}

	userRepository := user.NewRepository(dbConn.GetDB())
	userService := user.NewService(userRepository)
	userHandler := user.NewHandler(userService)

	hub := ws.NewHub()
	wsHandler := ws.NewHandler(hub)
	go hub.Run()

	router.InitRouter(userHandler, wsHandler)
	router.Start("0.0.0.0:8080")
}
