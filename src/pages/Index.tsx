import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface WordEntry {
  id: string;
  word: string;
  definition: string;
  synonyms: string[];
  createdAt: number;
}

const Index = () => {
  const [words, setWords] = useState<WordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newSynonyms, setNewSynonyms] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<'home' | 'library' | 'add'>('home');
  const [editingWord, setEditingWord] = useState<WordEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedWords = localStorage.getItem('dictionary_words');
    if (savedWords) {
      setWords(JSON.parse(savedWords));
    }
  }, []);

  const saveWords = (updatedWords: WordEntry[]) => {
    localStorage.setItem('dictionary_words', JSON.stringify(updatedWords));
    setWords(updatedWords);
  };

  const addWord = () => {
    if (!newWord.trim() || !newDefinition.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните слово и определение",
        variant: "destructive"
      });
      return;
    }

    const existingWord = words.find(w => w.word.toLowerCase() === newWord.toLowerCase());
    if (existingWord) {
      toast({
        title: "Дубликат обнаружен",
        description: `Слово "${newWord}" уже существует в словаре`,
        variant: "destructive"
      });
      return;
    }

    const synonymsArray = newSynonyms
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const entry: WordEntry = {
      id: Date.now().toString(),
      word: newWord.trim(),
      definition: newDefinition.trim(),
      synonyms: synonymsArray,
      createdAt: Date.now()
    };

    const updatedWords = [...words, entry];
    saveWords(updatedWords);

    setNewWord('');
    setNewDefinition('');
    setNewSynonyms('');
    setIsAddDialogOpen(false);

    toast({
      title: "Успешно",
      description: `Слово "${entry.word}" добавлено в словарь`
    });
  };

  const deleteWord = (id: string) => {
    const word = words.find(w => w.id === id);
    const updatedWords = words.filter(w => w.id !== id);
    saveWords(updatedWords);
    
    toast({
      title: "Удалено",
      description: `Слово "${word?.word}" удалено из словаря`
    });
  };

  const openEditDialog = (word: WordEntry) => {
    setEditingWord(word);
    setIsEditDialogOpen(true);
  };

  const updateWord = () => {
    if (!editingWord) return;

    if (!editingWord.word.trim() || !editingWord.definition.trim()) {
      toast({
        title: "Ошибка",
        description: "Заполните слово и определение",
        variant: "destructive"
      });
      return;
    }

    const updatedWords = words.map(w => 
      w.id === editingWord.id ? editingWord : w
    );
    saveWords(updatedWords);
    setIsEditDialogOpen(false);
    setEditingWord(null);

    toast({
      title: "Обновлено",
      description: `Слово "${editingWord.word}" успешно изменено`
    });
  };

  const exportDictionary = () => {
    const dataStr = JSON.stringify(words, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dictionary_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    toast({
      title: "Экспорт завершен",
      description: "Словарь сохранен на устройство"
    });
  };

  const importDictionary = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (Array.isArray(imported)) {
          saveWords(imported);
          toast({
            title: "Импорт завершен",
            description: `Загружено ${imported.length} слов`
          });
        }
      } catch (error) {
        toast({
          title: "Ошибка импорта",
          description: "Неверный формат файла",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-accent/30 text-accent-foreground font-medium">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon name="BookOpen" className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-primary">Профессиональный словарь</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={activeView === 'home' ? 'default' : 'ghost'}
                onClick={() => setActiveView('home')}
                className="gap-2"
              >
                <Icon name="Home" size={18} />
                Главная
              </Button>
              <Button
                variant={activeView === 'library' ? 'default' : 'ghost'}
                onClick={() => setActiveView('library')}
                className="gap-2"
              >
                <Icon name="Library" size={18} />
                Библиотека
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Icon name="Plus" size={18} />
                    Добавить слово
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Добавить новое слово</DialogTitle>
                    <DialogDescription>
                      Заполните информацию о слове и его определении
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Слово</label>
                      <Input
                        placeholder="Введите слово"
                        value={newWord}
                        onChange={(e) => setNewWord(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Определение</label>
                      <Textarea
                        placeholder="Введите определение слова"
                        value={newDefinition}
                        onChange={(e) => setNewDefinition(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Синонимы</label>
                      <Input
                        placeholder="Введите синонимы через запятую"
                        value={newSynonyms}
                        onChange={(e) => setNewSynonyms(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Отмена
                    </Button>
                    <Button onClick={addWord}>Добавить</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'home' && (
          <div className="space-y-8">
            <div className="text-center space-y-4 py-12">
              <h2 className="text-4xl font-bold text-primary">Управление профессиональным словарем</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Создавайте, храните и расширяйте свой персональный словарь терминов с определениями и синонимами
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                    <Icon name="Plus" className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Добавление слов</CardTitle>
                  <CardDescription>
                    Быстрое добавление новых терминов с определениями и синонимами
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                    <Icon name="Search" className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Умный поиск</CardTitle>
                  <CardDescription>
                    Мгновенный поиск по словам, определениям и синонимам с подсветкой
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-2">
                    <Icon name="AlertCircle" className="w-6 h-6 text-accent" />
                  </div>
                  <CardTitle>Контроль дубликатов</CardTitle>
                  <CardDescription>
                    Автоматическое выявление одинаковых слов при добавлении
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Статистика словаря</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Всего слов</p>
                    <p className="text-3xl font-bold text-primary">{words.length}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">С синонимами</p>
                    <p className="text-3xl font-bold text-primary">
                      {words.filter(w => w.synonyms.length > 0).length}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Всего синонимов</p>
                    <p className="text-3xl font-bold text-primary">
                      {words.reduce((acc, w) => acc + w.synonyms.length, 0)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Работает оффлайн</p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-medium">Активно</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeView === 'library' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-primary">Библиотека слов</h2>
                <p className="text-muted-foreground mt-1">Всего записей: {words.length}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportDictionary} className="gap-2">
                  <Icon name="Download" size={18} />
                  Сохранить
                </Button>
                <label>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importDictionary}
                    className="hidden"
                  />
                  <Button variant="outline" className="gap-2" asChild>
                    <span>
                      <Icon name="Upload" size={18} />
                      Загрузить
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="relative">
              <Icon name="Search" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Поиск по словарю..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {filteredWords.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Icon name="BookOpen" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg text-muted-foreground">
                    {words.length === 0
                      ? 'Словарь пуст. Начните добавлять слова.'
                      : 'Ничего не найдено по вашему запросу.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredWords.map((word) => (
                  <Card key={word.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">
                            {highlightText(word.word, searchQuery)}
                          </CardTitle>
                          <CardDescription className="text-base leading-relaxed">
                            {highlightText(word.definition, searchQuery)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(word)}
                            className="text-primary hover:text-primary"
                          >
                            <Icon name="Pencil" size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteWord(word.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Icon name="Trash2" size={18} />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {word.synonyms.length > 0 && (
                      <>
                        <Separator />
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-2">Синонимы:</p>
                          <div className="flex flex-wrap gap-2">
                            {word.synonyms.map((synonym, idx) => (
                              <Badge key={idx} variant="secondary" className="text-sm">
                                {highlightText(synonym, searchQuery)}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактировать слово</DialogTitle>
            <DialogDescription>
              Внесите изменения в информацию о слове
            </DialogDescription>
          </DialogHeader>
          {editingWord && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Слово</label>
                <Input
                  placeholder="Введите слово"
                  value={editingWord.word}
                  onChange={(e) => setEditingWord({...editingWord, word: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Определение</label>
                <Textarea
                  placeholder="Введите определение слова"
                  value={editingWord.definition}
                  onChange={(e) => setEditingWord({...editingWord, definition: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Синонимы</label>
                <Input
                  placeholder="Введите синонимы через запятую"
                  value={editingWord.synonyms.join(', ')}
                  onChange={(e) => setEditingWord({
                    ...editingWord, 
                    synonyms: e.target.value.split(',').map(s => s.trim()).filter(s => s.length > 0)
                  })}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={updateWord}>Сохранить изменения</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;