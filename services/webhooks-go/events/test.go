package events

import (
	"fmt"
	"sync"
)

func ListenChannelFollow(wg *sync.WaitGroup, userId string, scopes string) {
	defer wg.Done()

	fmt.Println(userId, ": listenning complete test")

}
