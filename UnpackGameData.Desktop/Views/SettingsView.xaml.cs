using System.IO;
using System.Windows;
using System.Windows.Controls;
using UserControl = System.Windows.Controls.UserControl;
using System.Windows.Forms;
using X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

namespace X4SaveAnalyser.UnpackGameData.Desktop.Views;

public partial class SettingsView : UserControl
{
    private SettingsViewModel? Vm => DataContext as SettingsViewModel;

    public SettingsView()
    {
        InitializeComponent();
    }

    private void BrowseGameFolder_Click(object sender, RoutedEventArgs e)
    {
        string? dir = BrowseForFolder("Select X4 Foundations installation folder", Vm?.GameFolder ?? string.Empty);
        if (dir is not null && Vm is not null) Vm.GameFolder = dir;
    }

    private void BrowseSaveFolder_Click(object sender, RoutedEventArgs e)
    {
        string? dir = BrowseForFolder("Select X4 save files folder", Vm?.SaveFolder ?? string.Empty);
        if (dir is not null && Vm is not null) Vm.SaveFolder = dir;
    }

    private void BrowseOutputFolder_Click(object sender, RoutedEventArgs e)
    {
        string? dir = BrowseForFolder("Select root output folder", Vm?.OutputFolder ?? string.Empty);
        if (dir is not null && Vm is not null) Vm.OutputFolder = dir;
    }

    private static string? BrowseForFolder(string description, string initialDir)
    {
        using var dialog = new FolderBrowserDialog
        {
            Description = description,
            UseDescriptionForTitle = true,
            SelectedPath = Directory.Exists(initialDir) ? initialDir : string.Empty,
            ShowNewFolderButton = true
        };
        return dialog.ShowDialog() == DialogResult.OK ? dialog.SelectedPath : null;
    }
}
