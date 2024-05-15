package user

import (
	"context"
	"strconv"
	"time"

	"github.com/abhilashdk2016/golang-nextjs-chat-app/util"
	"github.com/golang-jwt/jwt/v4"
)

type service struct {
	repository Repository
	timeout    time.Duration
}

const (
	secretKey = "secretkey"
)

func NewService(repository Repository) Service {
	return &service{
		repository: repository,
		timeout:    time.Duration(2) * time.Second,
	}
}

func (s *service) CreateUser(c context.Context, req *CreateUserRequest) (*CreateUserResponse, error) {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	hashedPassword, err := util.HasHPassword(req.Password)
	if err != nil {
		return nil, err
	}

	u := &User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
	}

	user, err := s.repository.CreateUser(ctx, u)
	if err != nil {
		return nil, err
	}

	res := &CreateUserResponse{
		ID:       strconv.Itoa(int(user.ID)),
		Username: user.Username,
		Email:    user.Email,
	}

	return res, nil
}

type JWTCLaims struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func (s *service) Login(c context.Context, req *LogInUserRequest) (*LogInUserResponse, error) {
	ctx, cancel := context.WithTimeout(c, s.timeout)
	defer cancel()

	u, err := s.repository.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return &LogInUserResponse{}, err
	}

	err = util.CheckHashedPassword(req.Password, u.Password)
	if err != nil {
		return &LogInUserResponse{}, err
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, JWTCLaims{
		ID:       strconv.Itoa(int(u.ID)),
		Username: u.Username,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    strconv.Itoa(int(u.ID)),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	})
	ss, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return &LogInUserResponse{}, err
	}

	return &LogInUserResponse{
		accessToken: ss,
		Username:    u.Username,
		ID:          u.ID,
	}, nil
}
