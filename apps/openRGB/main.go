package main

import (
	"fyne.io/fyne/v2/app"
	"fyne.io/fyne/v2/container"
	"fyne.io/fyne/v2/data/binding"
	"fyne.io/fyne/v2/widget"
)

func main() {
	a := app.New()
	w := a.NewWindow("Hello")

	server := binding.NewString()
	server.Set("localhost:6742")

	serverLabel := widget.NewLabel("OpenRGB Server")
	serverInput := widget.NewEntryWithData(server)
	connectButton := widget.NewButton("Connect to OpenRGB", func() {
		serverInput.Disable()
		
	})
	w.SetContent(container.NewVBox(
		container.NewVBox(
			serverLabel,
			serverInput,
		),
		connectButton,
	))

	w.ShowAndRun()

	// m, err := model.NewModel(log, "localhost:6742", "go-openrgb basic example")
	// if err != nil {
	// 	fmt.Print("Error decoding response:", err)
	// 	os.Exit(1)
	// }

	// fmt.Print("Connected to OpenRGB server", "devices", len(m.Devices))

	// println(m.Devices)

	// w.ShowAndRun()
}
