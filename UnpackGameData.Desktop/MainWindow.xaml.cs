using System.Windows;
using X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

namespace X4SaveAnalyser.UnpackGameData.Desktop;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        DataContext = new MainViewModel();
    }
}
