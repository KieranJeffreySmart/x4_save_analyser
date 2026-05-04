using System.Windows.Controls;
using UserControl = System.Windows.Controls.UserControl;
using X4SaveAnalyser.UnpackGameData.Desktop.ViewModels;

namespace X4SaveAnalyser.UnpackGameData.Desktop.Views;

public partial class ArchiveExtractorView : UserControl
{
    private ArchiveExtractorViewModel? _vm;

    public ArchiveExtractorView()
    {
        InitializeComponent();
        DataContextChanged += OnDataContextChanged;
    }

    private void OnDataContextChanged(object sender, System.Windows.DependencyPropertyChangedEventArgs e)
    {
        if (_vm is not null) _vm.LogUpdated -= OnLogUpdated;
        _vm = e.NewValue as ArchiveExtractorViewModel;
        if (_vm is not null) _vm.LogUpdated += OnLogUpdated;
    }

    private void OnLogUpdated(object? sender, System.EventArgs e) => LogBox.ScrollToEnd();
}
