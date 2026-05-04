using System.IO;
using System.Windows;
using System.Windows.Controls;
using UserControl = System.Windows.Controls.UserControl;
using X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

namespace X4SaveAnalyser.UnpackGameData.Desktop.Views;

public partial class UniverseExtractorView : UserControl
{
    private UniverseExtractorViewModel? _vm;

    public UniverseExtractorView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object sender, DependencyPropertyChangedEventArgs e)
    {
        if (_vm is not null) _vm.LogUpdated -= OnLogUpdated;
        _vm = e.NewValue as UniverseExtractorViewModel;
        if (_vm is not null) _vm.LogUpdated += OnLogUpdated;
    }

    private void OnLogUpdated(object? sender, System.EventArgs e) => LogBox.ScrollToEnd();

    private void BrowseSaveFile_Click(object sender, RoutedEventArgs e)
    {
        var dialog = new Microsoft.Win32.OpenFileDialog
        {
            Title = "Select X4 save file",
            Filter = "X4 save files (*.xml;*.xml.gz;*.gz)|*.xml;*.xml.gz;*.gz|All files (*.*)|*.*",
            CheckFileExists = true
        };

        string initialDir = (_vm is not null && !string.IsNullOrEmpty(_vm.SaveFolder) && Directory.Exists(_vm.SaveFolder))
            ? _vm.SaveFolder
            : (File.Exists(_vm?.SourceFile) ? Path.GetDirectoryName(_vm!.SourceFile)! : string.Empty);

        if (!string.IsNullOrEmpty(initialDir))
            dialog.InitialDirectory = initialDir;

        if (dialog.ShowDialog() == true && _vm is not null)
            _vm.SourceFile = dialog.FileName;
    }
}
