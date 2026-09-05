package main

import "fmt"

type Horizon struct { Name string; Glow int }

func main() {
    // Muted comments, sage strings, and amber functions.
    sky := Horizon{Name: "Afterglow", Glow: 84}
    if sky.Glow > 0 { fmt.Println(sky.Name) }
}
