package debug

import (
	"fmt"
)

func PrintAny(obj interface{}) {
	fmt.Printf("%+v\n", obj)
}
